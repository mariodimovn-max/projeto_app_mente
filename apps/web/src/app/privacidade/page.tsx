import Link from "next/link";
import styles from "./page.module.css";

// Story 5.4, AC2: política de privacidade acessível a partir do selo (PrivacySeal), em
// qualquer tela — inclusive para visitantes anônimos, então esta rota não exige sessão.
// A copy descreve o modelo real de proteção (architecture.md, seção "Authentication &
// Security"): criptografia em repouso + TLS em trânsito, nunca E2EE literal nem
// "armazenamento local" — um agente de IA precisa ler o texto em claro para gerar respostas
// e detectar padrões, então essa limitação é explicada em vez de escondida (honestidade é um
// valor do produto, ver CLAUDE.md).
export default function PrivacyPolicyPage() {
  return (
    <main className={styles.main}>
      <Link href="/" className={styles.backLink}>
        ← Voltar
      </Link>

      <header className={styles.header}>
        <p className={styles.eyebrow}>privacidade</p>
        <h1 className={styles.title}>Como seus dados são usados</h1>
        <p className={styles.subtitle}>
          Este app existe para ser um espelho reflexivo, não um produto que lucra com os seus
          dados. Esta página descreve, sem termos vagos, o que protegemos e o que realmente
          acontece com o que você escreve aqui.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Como seus dados são protegidos</h2>
        <p className={styles.text}>
          Toda comunicação entre o seu dispositivo e os nossos servidores usa TLS 1.3+ (o mesmo
          protocolo de criptografia usado por bancos e serviços de e-mail). Os dados armazenados
          — mensagens, sínteses, padrões identificados — ficam em um banco de dados
          (Supabase/Postgres) criptografado em repouso com AES-256. Sua senha nunca é guardada em
          texto puro: passa por bcrypt antes de ser salva. O acesso aos seus próprios dados é
          isolado por regras no banco (Row Level Security) — nenhum outro usuário consegue ler o
          que é seu.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Por que não é "ponta a ponta" no sentido literal</h2>
        <p className={styles.text}>
          Para conversar com você, gerar sínteses e identificar padrões ao longo do tempo, o
          agente de IA precisa processar o conteúdo das suas mensagens em texto legível — isso é
          fisicamente incompatível com uma criptografia de ponta a ponta onde nem o servidor
          consegue ler os dados. Preferimos dizer isso com clareza a prometer uma proteção que o
          app não tem: o que oferecemos é criptografia em trânsito (TLS) e em repouso (AES-256),
          não a impossibilidade técnica de leitura pelo servidor.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quem processa o conteúdo das suas conversas</h2>
        <p className={styles.text}>
          Suas mensagens são enviadas, no momento em que você conversa, para a API da Anthropic
          (Claude) — o modelo de IA que gera as respostas e ajuda a identificar padrões. Essa
          chamada acontece sempre pelo nosso servidor: a chave de acesso a essa API nunca é
          exposta ao seu navegador. Fora dessa finalidade, o conteúdo das suas conversas não é
          compartilhado com ninguém.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quem, na equipe, pode acessar seus dados</h2>
        <p className={styles.text}>
          No dia a dia, ninguém lê o conteúdo das suas conversas — o acesso técnico de
          administração existe apenas para manter a infraestrutura funcionando (ex.: resolver um
          problema que você reporte) e não é usado para leitura casual. Eventos sensíveis como
          login, exportação de dados e exclusão de conta ficam registrados em uma trilha de
          auditoria interna, que nem você nem a equipe podem editar — ela existe só para
          responsabilização em caso de incidente.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Zero venda ou compartilhamento comercial</h2>
        <p className={styles.text}>
          Seus dados não são vendidos, nem compartilhados com terceiros para publicidade ou
          qualquer outro fim comercial. Este app está em beta fechado, por convite, sem modelo de
          negócio baseado em dados de usuário.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Seus direitos sobre os seus dados</h2>
        <p className={styles.text}>
          Você pode exportar uma cópia completa de tudo que guardamos sobre você (sessões,
          mensagens, sínteses e padrões) em formato JSON, a qualquer momento, em Configurações.
          Você também pode excluir sua conta quando quiser — isso é permanente e irreversível:
          todos os seus dados são destruídos, não passam por um período de retenção nem podem ser
          recuperados depois.
        </p>
      </section>

      <p className={styles.footnote}>
        Este app não substitui acompanhamento psicológico ou médico. Se você estiver em risco
        imediato, procure os serviços de emergência da sua região.
      </p>
    </main>
  );
}
