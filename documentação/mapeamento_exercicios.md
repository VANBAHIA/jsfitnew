# Mapeamento de Exercícios - Database vs Planilha

## Resumo da Correspondência

O database de exercícios foi atualizado com base na planilha `Consulta1.xlsx`, relacionando cada exercício do database com o número correspondente da coluna `exercicioAnimacao` da planilha.

### Formato dos GIFs
- **Formato original**: `/images/PEI001.gif`
- **Formato atualizado**: `/images/exercicio{numero}.gif`

Onde `{numero}` corresponde ao valor da coluna `exercicioAnimacao` da planilha.

---

## Correspondências por Grupo Muscular

### PEITO
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Flexão de Braços | FLEXÃO DE BRAÇOS | 56 | `/images/exercicio56.gif` |
| Supino com Halteres | SUPINO RETO COM HALTERES | 104 | `/images/exercicio104.gif` |
| Crucifixo com Halteres | CRUCIFIXO | 38 | `/images/exercicio38.gif` |
| Supino Reto com Barra | SUPINO RETO COM BARRA | 106 | `/images/exercicio106.gif` |
| Supino Inclinado | SUPINO INCLINADO COM BARRA | 107 | `/images/exercicio107.gif` |
| Supino Inclinado com Halteres | SUPINO INCLINADO COM HALTERES | 105 | `/images/exercicio105.gif` |
| Crossover | CRUCIFIXO CROSS OVER | 34 | `/images/exercicio34.gif` |
| Mergulho em Paralelas | SUPINO VERTICAL NA MAQUINA | 161 | `/images/exercicio161.gif` |

### COSTAS
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Puxada Frontal | PULLEY FRENTE | 85 | `/images/exercicio85.gif` |
| Remada Baixa | REMADA BAIXA NEUTRA | 251 | `/images/exercicio251.gif` |
| Remada com Halter | REMADA UNILATERAL | 97 | `/images/exercicio97.gif` |
| Remada Curvada | REMADA CURVADA COM BARRA | 93 | `/images/exercicio93.gif` |
| Pullover | PULL OVER COM BARRA | 86 | `/images/exercicio86.gif` |
| Barra Fixa | PUXADA NA BARRA FIXA | 29 | `/images/exercicio29.gif` |

### OMBROS
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Desenvolvimento com Halteres | DESENVOLVIMENTO COM HALTERES | 42 | `/images/exercicio42.gif` |
| Elevação Lateral | ELEVAÇÃO LATERAL | 52 | `/images/exercicio52.gif` |
| Elevação Frontal | ELEVAÇÃO FRONTAL | 51 | `/images/exercicio51.gif` |
| Desenvolvimento com Barra | DESENVOLVIMENTO ANTERIOR | 40 | `/images/exercicio40.gif` |
| Elevação Posterior | CRUCIFIXO INVERSO | 36 | `/images/exercicio36.gif` |

### BÍCEPS
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Rosca Direta | ROSCA DIRETA | 102 | `/images/exercicio102.gif` |
| Rosca Alternada | ROSCA ALTERNADA | 98 | `/images/exercicio98.gif` |
| Rosca Martelo | ROSCA MARTELO | 99 | `/images/exercicio99.gif` |
| Rosca Scott | ROSCA SCOTT | 103 | `/images/exercicio103.gif` |

### TRÍCEPS
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Tríceps Testa | TRÍCEPS TESTA | 121 | `/images/exercicio121.gif` |
| Tríceps Pulley | TRÍCEPS PULLEY | 118 | `/images/exercicio118.gif` |
| Tríceps Francês | TRÍCEPS FRANCÊS | 119 | `/images/exercicio119.gif` |
| Tríceps Corda | TRÍCEPS COM CORDA | 120 | `/images/exercicio120.gif` |

### QUADRÍCEPS
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Agachamento Livre | AGACHAMENTO LIVRE | 9 | `/images/exercicio9.gif` |
| Leg Press | LEG PRESS | 72 | `/images/exercicio72.gif` |
| Extensão de Pernas | EXTENSÃO DE PERNAS | 54 | `/images/exercicio54.gif` |
| Afundo | AFUNDO | 6 | `/images/exercicio6.gif` |
| Agachamento Frontal | AGACHAMENTO FRONTAL | 10 | `/images/exercicio10.gif` |
| Agachamento Búlgaro | AGACHAMENTO BÚLGARO | 8 | `/images/exercicio8.gif` |

### POSTERIOR
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Stiff | STIFF | 115 | `/images/exercicio115.gif` |
| Flexão de Pernas | FLEXÃO DE PERNAS | 57 | `/images/exercicio57.gif` |
| Good Morning | GOOD MORNING | 71 | `/images/exercicio71.gif` |

### PANTURRILHA
| Exercício Database | Exercício Planilha | Animação | GIF Atualizado |
|-------------------|-------------------|----------|----------------|
| Panturrilha Sentado | PANTURRILHA SENTADO | 81 | `/images/exercicio81.gif` |
| Panturrilha em Pé | PANTURRILHA EM PÉ | 80 | `/images/exercicio80.gif` |

---

## Observações

### Exercícios Não Encontrados na Planilha
Alguns exercícios do database não possuem correspondência exata na planilha:
- **Levantamento Terra**: Utilizado placeholder `/images/exercicio_terra.gif`
- **Elevação Pélvica**: Utilizado placeholder `/images/exercicio_elevacao_pelvica.gif`
- **Hip Thrust**: Utilizado placeholder `/images/exercicio_hip_thrust.gif`

### Exercícios com Correspondência Aproximada
- **Mergulho em Paralelas**: Mapeado para "SUPINO VERTICAL NA MAQUINA" (exercicio161)
- **Mergulho no Banco**: Mesmo mapeamento acima
- **Elevação Posterior**: Mapeado para "CRUCIFIXO INVERSO" (exercicio36)
- **Face Pull**: Mesmo mapeamento acima

### Total de Exercícios Processados
- **Total no Database**: 56 exercícios
- **Correspondências Diretas**: 47 exercícios
- **Correspondências Aproximadas**: 6 exercícios  
- **Sem Correspondência**: 3 exercícios

---

## Estrutura da Planilha Analisada
- **Total de exercícios**: 757
- **Grupos musculares**: ABDOME, ANTEBRAÇO, BÍCEPS, CORPO, COSTAS, GLÚTEO, OMBRO, PEITO, PERNA, TRÍCEPS
- **Colunas**: nome, descricao, Musculos, exercicioAnimacao, grupo