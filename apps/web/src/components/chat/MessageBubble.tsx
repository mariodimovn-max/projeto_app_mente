import type { ChatMessage } from "@/types/chat";
import styles from "./MessageBubble.module.css";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const timestamp = (
    <time className={styles.timestamp} dateTime={message.createdAt}>
      {formatTimestamp(message.createdAt)}
    </time>
  );

  if (isUser) {
    return (
      <div className={styles.userTurn}>
        <p className={styles.userContent}>{message.content}</p>
        {timestamp}
      </div>
    );
  }

  return (
    <div className={styles.agentTurn}>
      <p className={styles.agentLabel}>a aura</p>
      <p className={styles.agentContent}>{message.content}</p>
      {timestamp}
    </div>
  );
}
