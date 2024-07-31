import mercadopago

sdk = mercadopago.SDK("APP_USR-1709159904607332-072416-43222ee5707268796c8829b5f03d1dae-1914238007")
def gerar_link_pagamento():
    plan_id = '2c93808490edce280191044c92570658'
    plan_response = sdk.plan().get(plan_id)
    
    if plan_response['status'] == 200:
        return f"https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id={plan_id}"
    else:
        raise Exception("Não foi possível encontrar o plano de pagamento.")

def verificar_pagamento(preapproval_id):
    payment_response = sdk.preapproval().get(preapproval_id)
    
    if payment_response['status'] == 200:
        return payment_response['response']
    else:
        raise Exception("Não foi possível encontrar o pagamento. Tente atualizar a página ou aguarde alguns minutos e volte.")




# --- funcao pra gerar produto unico (sem mensalidade)
# def gerar_link_pagamento2():
#     sdk = mercadopago.SDK("APP_USR-1709159904607332-072416-43222ee5707268796c8829b5f03d1dae-1914238007")
#     payment_data = {
#         "items": [
#             {"id": "1", "title": "Speaker", "quantity": 1, "currency_id": "BRL", "unit_price": 100}
#         ],
#         "back_urls": {
#             "success": "http://127.0.0.1:8080/compracerta",#https://speaker-ia-f398b119c57e.herokuapp.com/
#             "failure": "http://127.0.0.1:8080/compraerrada",
#             "pending": "http://127.0.0.1:8080/comprapendente",
#         },
#         "auto_return": "all"
#     }
#     result = sdk.preference().create(payment_data)
#     payment = result["response"]
#     link_iniciar_pagamento = payment["init_point"]
#     return link_iniciar_pagamento