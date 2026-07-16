import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SESSION_USER_HEADER } from "@/proxy";
import { ChatWindow } from "@/components/chat/ChatWindow";
import styles from "./page.module.css";

export default async function ChatPage() {
  const headerList = await headers();
  const isAuthenticated = headerList.get(SESSION_USER_HEADER) === "1";

  if (!isAuthenticated) {
    redirect("/auth");
  }

  return (
    <main className={styles.main}>
      <ChatWindow />
    </main>
  );
}
