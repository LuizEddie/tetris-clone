# Tetris Clone

Clone do clássico Tetris feito **apenas com HTML, CSS e JavaScript** (sem bibliotecas, sem build e sem servidor). Os recordes ficam salvos no `localStorage` do navegador.

![preview](https://img.shields.io/badge/Tetris-HTML%20%7C%20CSS%20%7C%20JS-22d3ee)

## Como jogar

Abra o arquivo `index.html` no navegador — ou sirva a pasta com qualquer servidor estático:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Clique em **Jogar** (ou pressione `Enter`) e comece a empilhar.

## Controles

| Ação | Teclas |
| --- | --- |
| Mover | `←` `→` |
| Descer (soft drop) | `↓` |
| Girar | `↑` ou `X` |
| Girar anti-horário | `Z` |
| Queda rápida (hard drop) | `Espaço` |
| Reservar peça (hold) | `C` ou `Shift` |
| Pausar / continuar | `P` ou `Esc` |
| Reiniciar | `R` |

Em telas de toque, botões na parte inferior fazem as mesmas ações.

## Recursos

- Tabuleiro 10 × 20 com detecção de colisão e travamento com *lock delay*
- Rotação no padrão **SRS** com *wall kicks*
- Gerador **7-bag** (as sete peças aparecem em sequência embaralhada)
- Peça fantasma, fila das próximas 3 peças e peça reservada
- Pontuação, combos, níveis e velocidade progressiva
- Animação de limpeza de linha com partículas
- Sons sintetizados com Web Audio (com botão de mudo)
- Controles por teclado e por toque
- Pausa automática ao trocar de aba
- **Top 10 recordes salvos no `localStorage`** (com data e nível); os 5 melhores aparecem no painel

## Pontuação

| Linhas de uma vez | Pontos |
| --- | --- |
| 1 | 100 × nível |
| 2 | 300 × nível |
| 3 | 500 × nível |
| 4 (Tetris) | 800 × nível |

Combo: +50 × (combo − 1) × nível. Soft drop vale 1 ponto por célula e hard drop 2 pontos por célula.

## Estrutura

```
index.html   # marcação e painéis
style.css    # tema escuro/neon e layout responsivo
game.js      # toda a lógica do jogo
```

Recordes: chave `tetris.highscores.v1` · preferência de som: `tetris.muted.v1`.
