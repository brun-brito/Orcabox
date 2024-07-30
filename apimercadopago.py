import mercadopago

def gerar_link_pagamento():
    sdk = mercadopago.SDK("APP_USR-1709159904607332-072416-43222ee5707268796c8829b5f03d1dae-1914238007")

    payment_data = {
        "items": [
            {"id": "1", "title": "Speaker", "quantity": 1, "currency_id": "BRL", "unit_price": 100}
        ],
        "back_urls": {
            "success": "http://127.0.0.1:5500/compracerta",
            "failure": "http://127.0.0.1:5500/compraerrada",
            "pending": "http://127.0.0.1:5500/comprapendente",
        },
        "auto_return": "all"
    }
    result = sdk.preference().create(payment_data)
    payment = result["response"]
    link_iniciar_pagamento = payment["init_point"]
    return link_iniciar_pagamento