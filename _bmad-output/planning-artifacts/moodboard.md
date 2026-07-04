# Moodboard — MVP (paleta, tipografia, exemplos)

Purpose: fornecer um guia visual conciso para orientar o Step 6 (Design System) e os primeiros wireframes do MVP.

## Paleta (dark / tecnológico)

- Base / Background: #0C1118 (fundo profundo)
- Surface / Cards: #151B25 (superfície fria)
- Surface alternative: #1F2836 (painel escuro)
- Border / Glow: rgba(255,255,255,0.08)
- Text primary: #E7F1FF
- Text muted: #9FB1C3
- Accent 1: #4FD1CA (ciano vibrante)
- Accent 2: #6B95D6 (azul elétrico)
- Call-to-action: #7C63FF (violeta tecnológico)
- Error / Alert: #F1634D
- Success: #5EC3A5

Usage notes:
- Use `Accent 1` para ações de gravação e interações principais; `Accent 2` para destaques secundários e estados ativos.
- Surfaces devem manter transparência sutil e bordas leves para criar profundidade.
- Reserve o CTA violeta para estados de confirmação e botões de ação principal.

## Tipografia

- Heading: Inter (600) — sizes: H1 28, H2 22, H3 18 (mobile-focused scale)
- Body: Inter (400) — base 16px, line-height 1.45
- UI / Mono: Roboto Mono (400) for timestamps and microcopy where needed

Accessibility notes:
- Ensure contrast ratio >= 4.5:1 for body text over backgrounds; use darkened `Accent 1` (#274F50) if needed for small text.

## Components & Layout patterns

- Chat column: single-column, max width 720px, large vertical rhythm (20–24px gaps).
- Mic FAB: fixed bottom-right, circular 56px, primary color `Accent 1`, active waveform overlay during recording.
- Waveform strip: low-contrast animated waveform during capture; subtle shadow when active.
- Transcript block: editable text area under each message with inline-edit affordance "Tap to edit".
- Synthesis card: prominent card after session with Title, 2–3 bullets, sentiment chip, actions: "Save insight" / "Explore more".
- Bottom sheet: for session history and exports (slide-up, dim background).

## Microcopy seeds (to reuse)

- Onboarding headline: "Converse. Reflect. Notice." (short, ritual-focused)
- Onboarding privacy line: "Transcrições armazenadas localmente e criptografadas. Somente você pode acessá-las." + link "Como usamos seus dados"
- Recording hint: "Gravando — fale agora. Toque para pausar."
- Transcript hint: "Toque qualquer palavra para corrigir"
- Synthesis CTA: "Salvar insight" / "Ver recomendações"

## Visual examples to collect (placeholders)

- Onboarding single-screen (purpose / privacy / not-therapy) — screenshot
- Recording screen with waveform + FAB — screenshot
- Chat flow with transcript edits visible — screenshot
- Synthesis card / weekly summary — screenshot

## Deliverables for Step 6

- One-page moodboard (this file) + 1 PNG export (if desired)
- Token set: CSS variables for colors and font sizes
- Example components: `MicButton`, `TranscriptBlock`, `SynthesisCard` (simple HTML/CSS snippets)

---

Status: moodboard seed created. Next: export PNG moodboard and translate tokens into `variables.css` for Step 6.
