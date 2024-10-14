import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session
from services.mp_service import gerar_link_pagamento, verificar_pagamento
from werkzeug.utils import secure_filename
from services.planilha_service import processar_planilha
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import json
from dotenv import load_dotenv

app = Flask(__name__)
app.secret_key = 'supersecretkey'

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'xls', 'xlsx'}

load_dotenv()

firebase_key_json = os.getenv('FIREBASE_CREDENTIALS')
cred_data = json.loads(firebase_key_json)
cred = credentials.Certificate(cred_data)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Configurando logs
logging.basicConfig(level=logging.DEBUG)

def allowed_file(filename):
    logging.info(f"Verificando se o arquivo {filename} é permitido.")
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Função para salvar os produtos no Firestore com subcoleção
def salvar_produtos_firestore(email, produtos):
    try:
        distribuidores_ref = db.collection('distribuidores')
        query = distribuidores_ref.where('email', '==', email).limit(1).get()

        if query:
            user_ref = query[0].reference

        for produto in produtos:
            # Adicionando produto à subcoleção
            produto_ref = user_ref.collection('produtos').add(produto)
            produto_id = produto_ref[1]  # Pega o ID do produto adicionado
            logging.info(f"Produto {produto['nome']} salvo na subcoleção 'produtos' com ID: {produto_id}")
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
        logging.info(f"Arquivos no diretório: {os.listdir(app.config['UPLOAD_FOLDER'])}")
        
        return send_from_directory(app.config['UPLOAD_FOLDER'], 'planilha-modelo.xlsx', as_attachment=True)
    except FileNotFoundError as e:
        logging.error(f"Erro ao baixar a planilha: {e}")
        return render_template("error.html", error="Arquivo não encontrado.")


@app.route("/upload_success")
def upload_success():
    return render_template('upload_success.html')

@app.route("/login-distribuidor")
def login_distribuidor():
    return render_template("loginDistribuidor.html")

@app.route("/cadastro")
def cadastro_distribuidor():
    return render_template("cadastro.html")

@app.route("/welcome")
def welcome_distribuidor():
    return render_template("welcome.html")

@app.route("/")
def homepage():
    return render_template("home.html")


### ROTAS PARA OS PROFISSIONAIS: ###

@app.route("/login-profissional")
def login_profissional():
    return render_template("loginProfissional.html")

@app.route("/cadastro-profissional")
def cadastro_profissional():
    return render_template("cadastroProfissional.html")

@app.route("/welcome-profissional")
def welcome_profissional():
    try:
        link_iniciar_pagamento = gerar_link_pagamento()
        return render_template("welcomeProfissional.html", link_pagamento=link_iniciar_pagamento)
    except Exception as e:
        return str(e)


### ROTAS PARA CONFERÊNCIA DE PAGAMENTO ###

@app.route("/verificar_pagamento")
def verificar_pagamento_route():
    preapproval_id = request.args.get("preapproval_id")
    user_email = request.args.get("user_email")
    try:
        payment_details = verificar_pagamento(preapproval_id)
        status = payment_details.get("status")
        if status == "authorized":
            session['user_email'] = user_email
            session['payment_authorized'] = True
            return redirect(url_for('compra_certa'))
        else:
            session['payment_authorized'] = False
            return redirect(url_for('compra_errada'))
    except Exception as e:
        return render_template("error.html", message=str(e))
    
@app.route("/compracerta")
def compra_certa():
    if 'payment_authorized' in session and session['payment_authorized']:
        email = session.get('user_email')
        return render_template("compracerta.html", email=email)
    else:
        return redirect(url_for('homepage'))

@app.route("/compraerrada")
def compra_errada():
    return render_template("compraerrada.html")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
