import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, send_file
from services.mp_service import gerar_link_pagamento, verificar_pagamento
from werkzeug.utils import secure_filename
from services.planilha_service import processar_planilha
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import json
from dotenv import load_dotenv
import zipfile
from io import BytesIO
import tempfile

app = Flask(__name__)
app.secret_key = 'supersecretkey'

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'xls', 'xlsx', 'zip'}

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

        if not query:
            raise ValueError("Distribuidor não encontrado.")

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
            try:
                if file.filename.endswith('.zip'):
                    # Extrair arquivos do ZIP em um diretório temporário
                    with tempfile.TemporaryDirectory() as temp_dir:
                        zip_path = os.path.join(temp_dir, file.filename)
                        file.save(zip_path)

                        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                            zip_ref.extractall(temp_dir)

                        # Procura arquivos XLSX dentro do ZIP
                        xlsx_files = [f for f in os.listdir(temp_dir) if f.endswith('.xlsx')]
                        if not xlsx_files:
                            raise ValueError("Nenhum arquivo XLSX encontrado no ZIP.")

                        # Processar o primeiro XLSX encontrado
                        xlsx_path = os.path.join(temp_dir, xlsx_files[0])
                        with open(xlsx_path, 'rb') as xlsx_file:
                            produtos, produtos_ignorados = processar_planilha(xlsx_file)

                else:
                    # Se não for ZIP, processa o XLSX diretamente
                    produtos, produtos_ignorados = processar_planilha(file)

                logging.info(f"Processamento da planilha concluído com sucesso: {produtos}")

                email_usuario = request.form.get('email')
                salvar_produtos_firestore(email_usuario, produtos)

                if produtos_ignorados:
                    mensagem = f"Upload realizado com sucesso, mas os seguintes produtos foram ignorados: {', '.join(produtos_ignorados)}"
                else:
                    mensagem = "Upload realizado com sucesso!"

                return render_template('upload_success.html', mensagem=mensagem)

            except Exception as e:
                logging.error(f"Erro ao processar a planilha ou salvar no Firestore: {e}")
                return render_template('upload.html', error=str(e))
        else:
            logging.error("Formato de arquivo não permitido.")
            return render_template('upload.html', error="Formato de arquivo não permitido.")

    return render_template('upload.html')

@app.route("/download_model", methods=["GET"])
def download_model():
    try:
        modelo_path = os.path.join(app.config['UPLOAD_FOLDER'], 'planilha-modelo.xlsx')

        # Verifica se o arquivo existe
        if not os.path.isfile(modelo_path):
            logging.error("Arquivo de modelo não encontrado.")
            return render_template("error.html", error="Arquivo modelo não encontrado.")

        # Cria um ZIP em memória para enviar ao usuário
        memory_file = BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(modelo_path, 'planilha-modelo.xlsx')
        memory_file.seek(0)

        logging.info("Download do ZIP iniciado com sucesso.")
        return send_file(memory_file, download_name='planilha-modelo.zip', as_attachment=True)

    except Exception as e:
        logging.error(f"Erro ao baixar a planilha: {e}")
        return render_template("error.html", error="Erro ao baixar a planilha modelo.")



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
