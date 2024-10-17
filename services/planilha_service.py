# services/planilha_service.py
import openpyxl
from werkzeug.exceptions import BadRequest
from io import BytesIO

def processar_planilha(file):
    try:
        workbook = openpyxl.load_workbook(BytesIO(file.read()), data_only=True)
        sheet = workbook.active

        # Defina as colunas esperadas
        colunas_esperadas = ['Nome', 'Preço', 'Quantidade', 'Marca', 'Categoria']
        colunas = [cell.value for cell in sheet[1]]

        # Verifica se todas as colunas esperadas estão presentes
        for coluna in colunas_esperadas:
            if coluna not in colunas:
                raise BadRequest(f"Coluna '{coluna}' está faltando na planilha")

        dados = []
        produtos_ignorados = []  # Lista para armazenar produtos ignorados

        # Itera sobre as linhas a partir da segunda (dados)
        for row in sheet.iter_rows(min_row=2, values_only=True):
            nome = row[colunas.index('Nome')]
            preco = row[colunas.index('Preço')]
            quantidade = row[colunas.index('Quantidade')]

            if not nome or not preco or quantidade is None:
                raise BadRequest(f"Dados obrigatórios faltando na linha {row}")

            if quantidade == 0:
                produtos_ignorados.append(nome)  # Adiciona o produto à lista de ignorados
                continue  # Ignora o produto com quantidade 0

            # Formatar os dados do produto
            produto = {
                'nome': nome,
                'nome_lowercase': ''.join(nome.lower().split()),
                'preco': float(preco),
                'quantidade': int(quantidade),
                'marca': row[colunas.index('Marca')],
                'categoria': row[colunas.index('Categoria')]
            }

            dados.append(produto)

        return dados, produtos_ignorados  # Retorna os dados e os produtos ignorados

    except Exception as e:
        raise BadRequest(f"Erro ao processar a planilha: {str(e)}")
