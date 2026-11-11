# Avaliação da IA gratuita local

O objetivo é executar o provador sem cobrança por geração e sem enviar fotografias da cliente a terceiros. A API paga FASHN existente continua desativada; não foi cadastrada chave nem autorizado custo.

O modelo aberto [FASHN VTON v1.5](https://github.com/fashn-AI/fashn-vton-1.5) disponibiliza código e pesos sob Apache-2.0 e documenta execução em CPU. Ele também depende do human parser e dos componentes de detecção de pose; suas licenças e versões devem ser verificadas na implantação. Foram baixados o código oficial, os pesos do modelo e DWPose para `.local-data/`, fora do Git, e criado um ambiente Python local. Importações de PyTorch CPU, torchvision, ONNX Runtime, OpenCV e do pipeline passaram. O script oficial de download carregou o human parser, mas terminou com UnicodeEncodeError ao imprimir caracteres de desenho no terminal Windows; esse erro de saída não é evidência de inferência bem-sucedida.

Neste computador foram identificados Ryzen 7 4800HS, 16 GB de RAM instalada e gráficos integrados AMD; nenhuma GPU NVIDIA/CUDA foi detectada. Durante a avaliação, havia menos de 4 GB de RAM disponível, insuficiente para afirmar com segurança que o modelo e suas ativações caberão sem paginação excessiva. Ainda não houve geração real completa nem medição de tempo, memória ou qualidade; o provador não foi conectado a esse modelo nem está habilitado. A instalação ocupa alguns gigabytes e não requer API paga.

Antes de ativar: repetir a medição com memória livre, executar uma geração com os arquivos de exemplo oficiais em ambiente isolado e medir recursos, estabelecer limite de concorrência e timeout que efetivamente interrompa o processo, transmitir imagens pelo processo local sem logs ou arquivos permanentes, tratar adequadamente categoria da peça e consentimento, e testar falhas, cancelamento, privacidade e resultado. O texto atual de consentimento descreve a FASHN remota e deverá ser atualizado se o provedor local for integrado.

O seguinte comando PowerShell é um experimento manual com as imagens de exemplo fornecidas pelo projeto oficial, sem usar fotos de clientes. Os dez passos reduzem o trabalho em relação ao padrão de 30 e podem reduzir a qualidade; o tempo e a memória permanecem desconhecidos. Execute apenas quando houver memória livre suficiente e a máquina puder tolerar processamento intenso:

```powershell
$env:HF_HOME = Join-Path (Get-Location) '.local-data/fashn-hf-cache'
$env:PYTHONUTF8 = '1'
.local-data/fashn-cpu-env/Scripts/python.exe .local-data/fashn-vton-1.5/examples/basic_inference.py --weights-dir .local-data/fashn-weights --person-image .local-data/fashn-vton-1.5/examples/data/model.webp --garment-image .local-data/fashn-vton-1.5/examples/data/garment.webp --category tops --device cpu --num-timesteps 10 --output-dir .local-data/fashn-test-output
```

Uma [demonstração gratuita hospedada](https://huggingface.co/spaces/fashn-ai/fashn-vton-1.5) existe, com fila e [cotas de GPU](https://huggingface.co/docs/hub/spaces-zerogpu); ela é externa e enviaria imagens ao serviço, portanto não cumpre a exigência atual de processamento integralmente local. Não foi integrada nem recebeu imagens de clientes.
