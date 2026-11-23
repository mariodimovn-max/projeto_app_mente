import { redirect } from "next/navigation";
import { confirmOtpLink } from "@/lib/actions/confirmOtpLink";
import {
  FALLBACK_INVALID_REDIRECT,
  INVALID_REDIRECT_BY_TYPE,
  isOtpLinkType,
} from "@/lib/auth/otpLink";
import styles from "../page.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

const COPY = {
  invite: {
    eyebrow: "Convite",
    title: "Seu convite está pronto",
    subtitle: "Toque no botão abaixo para ativar sua conta. Em seguida, você vai criar sua senha.",
    button: "Ativar meu convite",
  },
  recovery: {
    eyebrow: "Nova senha",
    title: "Defina uma nova senha",
    subtitle: "Toque no botão abaixo para continuar. Em seguida, você vai escolher a nova senha.",
    button: "Continuar",
  },
} as const;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Abrir o link (GET) não consome o token de uso único: só o envio do formulário (POST, Server
// Action) chama verifyOtp. Prévias do WhatsApp e filtros de e-mail fazem GET e, antes, gastavam
// o convite antes de a pessoa tocar no link.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const type = single(params.type);
  const tokenHash = single(params.token_hash);
  const next = single(params.next);

  if (!isOtpLinkType(type)) {
    redirect(FALLBACK_INVALID_REDIRECT);
  }

  if (!tokenHash) {
    redirect(INVALID_REDIRECT_BY_TYPE[type]);
  }

  const copy = COPY[type];

  return (
    <main className={styles.main}>
      <section className={`${styles.card} container`} aria-labelledby="confirm-title">
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="confirm-title" className={styles.title}>
          {copy.title}
        </h1>
        <p className={styles.subtitle}>{copy.subtitle}</p>

        <form className={styles.form} action={confirmOtpLink}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="token_hash" value={tokenHash} />
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <button type="submit" className={styles.primaryButton}>
            {copy.button}
          </button>
        </form>
      </section>
    </main>
  );
}
