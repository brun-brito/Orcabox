from flask import Flask, render_template, request, redirect, url_for, session
from apimercadopago import gerar_link_pagamento, verificar_pagamento
from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY') 

@app.route("/")
def homepage():
    try:
        link_iniciar_pagamento = gerar_link_pagamento()
        return render_template("welcome.html", link_pagamento=link_iniciar_pagamento)
    except Exception as e:
        return str(e)

@app.route("/compracerta")
def compra_certa():
    email = session.get('user_email')
    return render_template("compracerta.html", email=email)

@app.route("/compraerrada")
def compra_errada():
    return render_template("compraerrada.html")

@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/cadastro")
def cadastro():
    return render_template("cadastro.html")

@app.route("/verificar_pagamento")
def verificar_pagamento_route():
    preapproval_id = request.args.get("preapproval_id")
    user_email = request.args.get("user_email")
    try:
        payment_details = verificar_pagamento(preapproval_id)
        status = payment_details.get("status")
        if status == "authorized":
            session['user_email'] = user_email
            return redirect(url_for('compra_certa'))
        else:
            return redirect(url_for('compra_errada'))
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
