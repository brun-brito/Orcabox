import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory
from werkzeug.utils import secure_filename
from services.planilha_service import processar_planilha
import firebase_admin
from firebase_admin import credentials, firestore
import logging

app = Flask(__name__)
app.secret_key = 'supersecretkey'

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'public/uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'xls', 'xlsx'}

cred_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'firebaseKey.json')
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# Inicializando o Firestore
db = firestore.client()

# Configurando logs
logging.basicConfig(level=logging.DEBUG)

def allowed_file(filename):
    logging.info(f"Verificando se o arquivo {filename} é permitido.")
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Função para salvar os produtos no Firestore com subcoleção
def salvar_produtos_firestore(email, produtos):
    try:
        # Obter referência ao documento do usuário (usando o email como ID)
        user_ref = db.collection('users').document(email)

        # Salvar cada produto como um documento dentro da subcoleção 'produtos' do usuário
        for produto in produtos:
            # Adiciona o produto na subcoleção 'produtos' do usuário
            produto_ref = user_ref.collection('produtos').add(produto)
            logging.info(f"Produto {produto['nome']} salvo na subcoleção 'produtos' com ID: {produto_ref}")
    except Exception as e:
        logging.error(f"Erro ao salvar produtos no Firestore: {e}")
        raise

# Rota para upload da planilha
@app.route("/upload", methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        logging.info("Recebendo requisição POST para upload.")
        if 'planilha' not in request.files:
            logging.error("Nenhuma planilha foi enviada no formulário.")
            return render_template('upload.html', error="Nenhuma planilha foi enviada.")
        
        file = request.files['planilha']
        if file.filename == '':
            logging.error("Nenhum arquivo selecionado.")
            return render_template('upload.html', error="Nenhuma planilha foi selecionada.")

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            logging.info(f"Arquivo {filename} salvo com sucesso em {file_path}")

            try:
                # Processar a planilha e obter os dados
                produtos = processar_planilha(file_path)
                logging.info(f"Processamento da planilha concluído com sucesso: {produtos}")

                # Vamos pegar o email do usuário (assumindo que ele esteja autenticado no Firebase front-end)
                # Para este exemplo, passamos o email como um parâmetro via POST ou autenticado
                email_usuario = request.form.get('email')  # Pegue o email do formulário ou da sessão

                # Salvar os produtos no Firestore, na subcoleção 'produtos' para o usuário
                salvar_produtos_firestore(email_usuario, produtos)

                return redirect(url_for('upload_success'))
            except Exception as e:
                logging.error(f"Erro ao processar a planilha ou salvar no Firestore: {e}")
                return render_template('upload.html', error=str(e))
        else:
            logging.error("Arquivo com formato não permitido.")
            return render_template('upload.html', error="Formato de arquivo não permitido.")
    
    logging.info("Acessando página de upload")
    return render_template('upload.html')

@app.route("/download_model")
def download_model():
    try:
        logging.info(f"Acessando rota de download da planilha modelo. Procurando em {app.config['UPLOAD_FOLDER']}")
        # Listar arquivos no diretório
        logging.info(f"Arquivos no diretório: {os.listdir(app.config['UPLOAD_FOLDER'])}")
        
        return send_from_directory(app.config['UPLOAD_FOLDER'], 'planilha-modelo.xlsx', as_attachment=True)
    except FileNotFoundError as e:
        logging.error(f"Erro ao baixar a planilha: {e}")
        return render_template("error.html", error="Arquivo não encontrado.")


@app.route("/upload_success")
def upload_success():
    return render_template('upload_success.html')

@app.route("/")
def homepage():
    logging.info("Acessando a homepage")
    return render_template("welcome.html")

@app.route("/index")
def index():
    logging.info("Acessando página index")
    return render_template("index.html")

@app.route("/cadastro")
def cadastro():
    logging.info("Acessando página de cadastro")
    return render_template("cadastro.html")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
