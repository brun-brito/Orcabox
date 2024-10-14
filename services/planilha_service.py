import openpyxl
from werkzeug.exceptions import BadRequest

# Função para processar a planilha
def processar_planilha(file_path):
    try:
        # Abre a planilha usando openpyxl
        workbook = openpyxl.load_workbook(file_path)
        sheet = workbook.active  # Pega a primeira planilha

        # Defina as colunas esperadas
        colunas_esperadas = ['Nome', 'Preço', 'Quantidade', 'Marca', 'Categoria']
        colunas = [cell.value for cell in sheet[1]]  # Primeira linha contém os nomes das colunas

        # Verifica se todas as colunas esperadas estão presentes
        for coluna in colunas_esperadas:
            if coluna not in colunas:
                raise BadRequest(f"Coluna '{coluna}' está faltando na planilha")

        dados = []

        # Itera sobre as linhas, começando da segunda (primeira contém cabeçalhos)
        for row in sheet.iter_rows(min_row=2, values_only=True):
            nome = row[colunas.index('Nome')]
            preco = row[colunas.index('Preço')]
            quantidade = row[colunas.index('Quantidade')]

            if not nome or not preco or not quantidade:
                raise BadRequest(f"Dados obrigatórios faltando na linha {row}")

            # Formatar dados como dicionário
            produto = {
                'nome': nome,
                'nome_lowercase': ''.join(nome.lower().split()),
                'preco': float(preco),
                'quantidade': int(quantidade),
                'marca': row[colunas.index('Marca')],
                'categoria': row[colunas.index('Categoria')]
            }

            dados.append(produto)

        # Agora que os dados estão validados, podemos armazená-los no banco de dados ou Firebase
        print("Dados processados com sucesso")
        return dados

    except Exception as e:
        raise BadRequest(f"Erro ao processar a planilha: {str(e)}")
