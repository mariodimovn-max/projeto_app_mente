# UX Patterns — History, Summaries, Indicators

## Objetivo

Definir os padrões de UX que garantem consistência no acesso a sessões anteriores, na visualização de resumos e na comunicação do estado do sistema para o usuário. Foco no MVP: torná-los simples, claros e emocionalmente seguros.

## Princípios Gerais

- **Memória acessível, não intrusiva**: histórico deve ser fácil de acessar sem dominar a tela principal.
- **Resumo significativo**: cada síntese deve destacar padrões reais e não frases vazias.
- **Estado visível**: o usuário deve entender facilmente quando está gravando, transcrevendo, esperando ou concluindo.
- **Acolhimento contínuo**: a linguagem de interface deve ser tranquila mesmo em estados de erro ou atenção.
- **Privacidade visível**: indicadores claros de proteção são parte do design de confiança.

## Padrão 1 — Histórico de Sessões

### O que é

Uma lista cronológica de sessões anteriores, acessível por um botão fixo no topo ou uma aba "Histórico".

### Como funciona

- Cada item apresenta:
  - data e hora da sessão
  - título curto gerado pelo usuário/IA (ex: "Noite de pensamento sobre propósito")
  - pílulas de tema (ex: "sono", "ansiedade", "propósito")
  - status breve: "síntese disponível" / "sem síntese" / "mais recente"
- A lista usa cartões com sombra suave e fundo escuro para manter o tom acolhedor.
- A primeira sessão recente fica em destaque com um rótulo "Última sessão".
- O usuário pode tocar para abrir a sessão completa ou deslizar para exibir ações rápidas: "Revisar" / "Marcar" / "Excluir".

### Comportamento ideal

- Sessões mais antigas aparecem com data completa; recentes exibem apenas o dia e a hora.
- O histórico é pesquisável por palavra-chave ou tema.
- Um badge discreto informa se há uma síntese disponível.

### Dados mostrados por item

- Título da sessão
- Data/hora
- 2-3 chips de tema
- Ícone de síntese pronta
- Indicador de privacidade: um pequeno selo "Privado"

## Padrão 2 — Resumos e Insights

### O que é

O cartão de síntese que aparece ao final de uma sessão e pode ser acessado pelo histórico ou por uma área de "Insights".

### Estrutura do cartão

- Cabeçalho: "Resumo da sessão" ou "Insight rápido"
- Chips temáticos: mostram os assuntos principais
- Lista de 2–3 pontos de insight
- Ação primária: "Salvar insight"
- Ação secundária: "Explorar mais"
- Nota de contexto: "Este resumo reflete os temas que você trouxe hoje."

### Microcopy recomendada

- "Percebi que você tende a evitar falar de X quando menciona Y."
- "Isso pode ser um bom ponto para revisitar amanhã."
- "Salvo com sucesso. Você pode ver esse insight em Histórico." 

### Hierarquia de destaque

- Texto do insight deve ser maior que as notas de chip.
- A cor do botão primário deve ser um tom terroso forte (`--color-cta`).
- O cartão deve ter bordas suaves e sombra mais profunda para se destacar.

## Padrão 3 — Indicadores de Estado

### Gravando

- Mostre um badge fixo: "Gravando..."
- Use uma animação sutil de onda ou pulso no botão de microfone.
- Exemplo de microcopy: "Fale com calma. Estamos captando suas palavras."

### Transcrição

- Exiba uma barra de progresso breve: "Transcrevendo..."
- Após a transcrição, troque para: "Transcrição pronta — revise se quiser"
- Indique claramente se o texto foi salvo automaticamente.

### Sessão concluída

- Mostre um cartão final com a síntese disponível.
- Copy de transição: "Aqui está o que aconteceu. Você pode salvar ou explorar mais tarde."

### Erro / alerta

- Mensagens breves e gentis: "Ocorreu um problema ao processar a sua voz. Vamos tentar de novo?"
- CTA de recuperação: "Regravar" / "Continuar com texto"
- Nunca use termos técnicos como "timeout" ou "API".

## Padrão 4 — Navegação entre histórico, sessão e insights

### Layout recomendado

- Barra inferior com 2 ou 3 ícones: "Início", "Histórico", "Insights".
- Uma segunda opção é manter o histórico em um botão no cabeçalho com um drawer lateral.
- No MVP, prefira uma navegação simples, não um menu complexo.

### Comportamento esperado

- Do chat principal, o usuário pode ir direto para histórico sem perder o estado da sessão em andamento.
- O botão "Insights" leva à visão consolidada com cartões de síntese e temas recorrentes.

## Padrão 5 — Privacidade e confiança

- Exiba um selo discreto: "Transcrições armazenadas localmente".
- No histórico e nos cards de síntese, inclua um link rápido: "Como seus dados são usados".
- Em telas de exclusão, use copy clara: "Excluir esta sessão e suas transcrições para sempre." 

## Recomendações de interação

- Use micro-interações suaves para indicar carga e estado.
- Prefira espaçamento generoso e tipografia espaçosa para leitura noturna.
- Use contrastes suaves para o tema escuro: fundos muito escuros (`#27221E`) e textos quase creme.
- A componente de chip deve ser compacta, arredondada e facilmente legível.

## Próximos entregáveis para Step 7

1. Mapear o fluxo de histórico completo em um wireframe adicional.
2. Quem sabe exportar um mini-proto de tela de "Insights" e um drawer de histórico.
3. Definir tokens de estado para indicadores: gravação, transcrição, insight salvo, erro.
