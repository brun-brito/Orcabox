import mercadopago

# sdk = mercadopago.SDK("APP_USR-2322858130583634-101123-c9a14922dac6fe3ac59354486c2ad434-352487457")
sdk = mercadopago.SDK("APP_USR-1709159904607332-072416-43222ee5707268796c8829b5f03d1dae-1914238007")
def gerar_link_pagamento():
    # plan_id = '2c93808492715aeb01927d258b8c0475'
    plan_id = '2c9380849274d44801928295d200041e'
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
        raise Exception("Não foi possível encontrar o pagamento. Provavelmente ainda está sendo processado.")
