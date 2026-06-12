import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import {
  createMentionNotifications,
  createNotification,
  resolveMentionedUsers,
} from "~/utils/notifications.server";

type ActionData = {
  error?: string;
};

type Recipient = {
  id: string;
  username: string;
  displayName: string;
  profilePhotoUrl: string | null;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export const meta: MetaFunction = () => {
  return [
    { title: "Messages | PaTan" },
    {
      name: "description",
      content:
        "Directly connect with community members and continue supportive conversations.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);
  const activeRecipientId = String(url.searchParams.get("with") ?? "").trim() || null;
  const showSentNotice = url.searchParams.get("sent") === "1";

  const [threads, following, followers, unreadCount] = await Promise.all([
    db.message.findMany({
      where: {
        deletedAt: null,
        OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }],
      },
      select: {
        senderId: true,
        receiverId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.follow.findMany({
      where: {
        followerId: sessionUser.id,
      },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhotoUrl: true,
            deletedAt: true,
          },
        },
      },
      take: 150,
    }),
    db.follow.findMany({
      where: {
        followingId: sessionUser.id,
      },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profilePhotoUrl: true,
            deletedAt: true,
          },
        },
      },
      take: 150,
    }),
    db.message.count({
      where: {
        receiverId: sessionUser.id,
        deletedAt: null,
        isRead: false,
      },
    }),
  ]);

  const threadPartnerOrder: string[] = [];
  const seenPartnerIds = new Set<string>();

  for (const thread of threads) {
    const partnerId =
      thread.senderId === sessionUser.id ? thread.receiverId : thread.senderId;

    if (!seenPartnerIds.has(partnerId)) {
      seenPartnerIds.add(partnerId);
      threadPartnerOrder.push(partnerId);
    }
  }

  const candidateMap = new Map<string, Recipient>();

  for (const relation of following) {
    const user = relation.following;

    if (!user.deletedAt && user.id !== sessionUser.id) {
      candidateMap.set(user.id, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePhotoUrl: user.profilePhotoUrl,
      });
    }
  }

  for (const relation of followers) {
    const user = relation.follower;

    if (!user.deletedAt && user.id !== sessionUser.id) {
      candidateMap.set(user.id, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePhotoUrl: user.profilePhotoUrl,
      });
    }
  }

  if (threadPartnerOrder.length > 0) {
    const threadUsers = await db.user.findMany({
      where: {
        id: {
          in: threadPartnerOrder,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePhotoUrl: true,
      },
    });

    for (const user of threadUsers) {
      candidateMap.set(user.id, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePhotoUrl: user.profilePhotoUrl,
      });
    }
  }

  let recipients = Array.from(candidateMap.values());

  recipients.sort((a, b) => {
    const aIndex = threadPartnerOrder.indexOf(a.id);
    const bIndex = threadPartnerOrder.indexOf(b.id);

    if (aIndex >= 0 && bIndex >= 0) {
      return aIndex - bIndex;
    }

    if (aIndex >= 0) {
      return -1;
    }

    if (bIndex >= 0) {
      return 1;
    }

    return a.displayName.localeCompare(b.displayName);
  });

  let activeRecipient =
    activeRecipientId && activeRecipientId !== sessionUser.id
      ? recipients.find((entry) => entry.id === activeRecipientId) ?? null
      : null;

  if (!activeRecipient && activeRecipientId && activeRecipientId !== sessionUser.id) {
    const fetched = await db.user.findFirst({
      where: {
        id: activeRecipientId,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePhotoUrl: true,
      },
    });

    if (fetched) {
      activeRecipient = fetched;
      recipients = [
        {
          id: fetched.id,
          username: fetched.username,
          displayName: fetched.displayName,
          profilePhotoUrl: fetched.profilePhotoUrl,
        },
        ...recipients,
      ];
    }
  }

  const messages = activeRecipient
    ? await db.message.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              senderId: sessionUser.id,
              receiverId: activeRecipient.id,
            },
            {
              senderId: activeRecipient.id,
              receiverId: sessionUser.id,
            },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          createdAt: true,
          isRead: true,
        },
      })
    : [];

  if (activeRecipient) {
    await db.message.updateMany({
      where: {
        senderId: activeRecipient.id,
        receiverId: sessionUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  return {
    sessionUserId: sessionUser.id,
    recipients,
    activeRecipient,
    messages,
    unreadCount,
    showSentNotice,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();

  const intent = String(formData.get("intent") ?? "").trim();
  const recipientId = String(formData.get("recipientId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (intent !== "send-message") {
    return { error: "Unsupported message action." } satisfies ActionData;
  }

  if (!recipientId) {
    return { error: "Choose a recipient before sending your message." } satisfies ActionData;
  }

  if (recipientId === sessionUser.id) {
    return { error: "You cannot message yourself." } satisfies ActionData;
  }

  if (!content) {
    return { error: "Write a message before sending." } satisfies ActionData;
  }

  if (content.length > 2000) {
    return { error: "Message must be 2000 characters or fewer." } satisfies ActionData;
  }

  const recipient = await db.user.findFirst({
    where: {
      id: recipientId,
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });

  if (!recipient) {
    return { error: "This recipient is no longer available." } satisfies ActionData;
  }

  const message = await db.message.create({
    data: {
      senderId: sessionUser.id,
      receiverId: recipient.id,
      content,
    },
    select: {
      id: true,
    },
  });

  await createNotification({
    userId: recipient.id,
    actorId: sessionUser.id,
    type: "MESSAGE",
    title: "New message",
    body: content.slice(0, 180),
    resourceId: sessionUser.id,
    resourceType: "message",
    data: {
      messageId: message.id,
    },
  });

  const mentionedUsers = await resolveMentionedUsers(content, [sessionUser.id, recipient.id]);

  if (mentionedUsers.length > 0) {
    await createMentionNotifications({
      mentionedUserIds: mentionedUsers.map((user) => user.id),
      actorId: sessionUser.id,
      title: "You were mentioned in a message",
      body: content.slice(0, 180),
      resourceId: sessionUser.id,
      resourceType: "message",
      data: {
        messageId: message.id,
      },
    });
  }

  return redirect(`/messages?with=${encodeURIComponent(recipient.id)}&sent=1`);
}

export default function MessagesRoute() {
  const { sessionUserId, recipients, activeRecipient, messages, unreadCount, showSentNotice } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const selectedRecipientId = String(searchParams.get("with") ?? "").trim();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="bg-midnight text-dawn py-10 sm:py-14" aria-labelledby="messages-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 id="messages-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Messages
          </h1>
          <p className="mt-3 text-dawn/75 max-w-3xl">
            Continue meaningful conversations with people in your community.
          </p>
          <p className="mt-3 text-sm text-dawn/85">{unreadCount} unread messages</p>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside
            className="rounded-2xl border border-midnight/10 bg-white p-4 sm:p-5 shadow-sm"
            aria-labelledby="message-partners-heading"
          >
            <h2 id="message-partners-heading" className="font-heading text-xl text-midnight">
              People
            </h2>

            {recipients.length === 0 ? (
              <p className="mt-3 text-sm text-night/70">
                Follow community members to start conversations.
              </p>
            ) : (
              <ul className="mt-3 space-y-2" role="list">
                {recipients.map((recipient) => {
                  const isActive = selectedRecipientId === recipient.id;

                  return (
                    <li key={recipient.id}>
                      <Link
                        to={`/messages?with=${encodeURIComponent(recipient.id)}`}
                        className={`min-h-[44px] rounded-xl border px-3 py-2.5 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${isActive ? "border-golden bg-[#FFF7E6]" : "border-midnight/10 hover:bg-surface"}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <div className="h-9 w-9 rounded-full bg-midnight/15 overflow-hidden flex items-center justify-center text-xs font-semibold text-midnight">
                          {recipient.profilePhotoUrl ? (
                            <img
                              src={recipient.profilePhotoUrl}
                              alt={`Profile avatar for ${recipient.displayName}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            recipient.displayName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-midnight">
                            {recipient.displayName}
                          </p>
                          <p className="truncate text-xs text-night/60">@{recipient.username}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section
            className="rounded-2xl border border-midnight/10 bg-white p-4 sm:p-5 shadow-sm"
            aria-labelledby="conversation-heading"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="conversation-heading" className="font-heading text-xl text-midnight">
                {activeRecipient
                  ? `Conversation with ${activeRecipient.displayName}`
                  : "Select a person to start messaging"}
              </h2>
              {activeRecipient ? (
                <Link
                  to={`/u/${activeRecipient.username}`}
                  className="text-sm font-semibold text-forest hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                >
                  View profile
                </Link>
              ) : null}
            </div>

            {actionData?.error ? (
              <p
                className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
                role="alert"
              >
                {actionData.error}
              </p>
            ) : null}

            {showSentNotice ? (
              <p
                className="mt-4 rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest"
                role="status"
                aria-live="polite"
              >
                Message sent.
              </p>
            ) : null}

            {activeRecipient ? (
              <>
                <div className="mt-4 h-[24rem] overflow-y-auto rounded-xl border border-midnight/10 bg-surface p-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-night/70">
                      No messages yet. Send the first note.
                    </p>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {messages.map((message) => {
                        const isMine = message.senderId === sessionUserId;

                        return (
                          <li key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <article
                              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${isMine ? "bg-midnight text-dawn" : "bg-white border border-midnight/10 text-night"}`}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <p className={`mt-1 text-[11px] ${isMine ? "text-dawn/75" : "text-night/55"}`}>
                                {formatDate(message.createdAt)}
                              </p>
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <Form method="post" className="mt-4 space-y-3">
                  <input type="hidden" name="intent" value="send-message" />
                  <input type="hidden" name="recipientId" value={activeRecipient.id} />
                  <label htmlFor="message-content" className="sr-only">
                    Message content
                  </label>
                  <textarea
                    id="message-content"
                    name="content"
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                    placeholder="Write a supportive message. Use @username to mention someone."
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn-primary min-h-[44px] px-5 py-2.5 text-sm"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send message"}
                    </button>
                  </div>
                </Form>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-midnight/10 bg-surface p-4 text-sm text-night/70">
                Choose a person from the list to open a conversation.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
