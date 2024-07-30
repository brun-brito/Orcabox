from flask import Flask, render_template
from apimercadopago import gerar_link_pagamento
import os

app = Flask(__name__)

@app.route("/")
def homepage():
    link_iniciar_pagamento = gerar_link_pagamento()
    return render_template("welcome.html", link_pagamento=link_iniciar_pagamento)

@app.route("/compracerta")
def compra_certa():
    return render_template("compracerta.html")

@app.route("/compraerrada")
def compra_errada():
    return render_template("compraerrada.html")

@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/cadastro")
def cadastro():
    return render_template("cadastro.html")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))