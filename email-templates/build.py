# Generates MIM-branded Shopify notification templates (Settings > Notifications > [email] > Edit code).
# One shared shell (header, hand-printed note, footer) + a body per template. Run: python3 build.py
import os
LOGO = "https://cdn.shopify.com/s/files/1/0071/9054/4487/files/mim-logo-hires.png"
INK, TEAL, TEAL_D, CREAM, MIST, MUTED = "#14272B", "#008F9D", "#00737E", "#F3ECE2", "#EEF6F7", "#5C6B6E"
FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"

def shell(title, preheader, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<style>
  @media (max-width:620px){{ .mim-card{{border-radius:0!important}} .mim-pad{{padding-left:22px!important;padding-right:22px!important}} .mim-h1{{font-size:26px!important}} }}
  a{{color:{TEAL}}}
</style>
</head>
<body style="margin:0;padding:0;background:{CREAM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{CREAM};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="mim-card" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;">
<tr><td align="center" style="padding:30px 20px 18px;border-bottom:1px solid {MIST};">
<a href="{{{{ shop.url }}}}" style="text-decoration:none;"><img src="{LOGO}" alt="MIM Creative Wear" width="132" style="display:block;width:132px;max-width:132px;height:auto;border:0;"></a>
</td></tr>
{body}
<tr><td class="mim-pad" style="padding:0 40px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{MIST};border-radius:16px;">
<tr><td style="padding:18px 20px;font-family:{FONT};font-size:14px;line-height:1.6;color:{INK};">
<span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:{TEAL_D};font-weight:bold;">Hand-printed in Cairo</span><br>
Every MIM piece is printed by hand with real leaves, sunlight or carved blocks, so no two are exactly alike. Yours is one of a kind.
</td></tr></table>
</td></tr>
<tr><td style="background:{INK};padding:26px 40px;font-family:{FONT};color:#ffffff;" class="mim-pad">
<p style="margin:0 0 12px;font-size:15px;font-weight:bold;">Questions? We're happy to help.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;">
<a href="https://wa.me/201222116237" style="color:#7FD3DB;text-decoration:none;">WhatsApp +20 12 22116237</a><br>
<a href="mailto:mim@mimcreativewear.com" style="color:#7FD3DB;text-decoration:none;">mim@mimcreativewear.com</a><br>
<a href="https://www.instagram.com/mimcreativewear" style="color:#7FD3DB;text-decoration:none;">Instagram @mimcreativewear</a>
</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#B9C4C6;">
Visit us: Fustat office (Ghoneim St., off El Gameya St.) · CSA Maadi shop (4 Road 21)<br>
<a href="{{{{ shop.url }}}}" style="color:#B9C4C6;">mimcreativewear.com</a>
</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>
"""

def intro(eyebrow, heading, text):
    return f"""<tr><td class="mim-pad" style="padding:34px 40px 8px;font-family:{FONT};">
<p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:{TEAL_D};font-weight:bold;">{eyebrow}</p>
<h1 class="mim-h1" style="margin:0 0 14px;font-size:30px;line-height:1.2;font-weight:600;color:{INK};">{heading}</h1>
<p style="margin:0;font-size:16px;line-height:1.65;color:{MUTED};">{text}</p>
</td></tr>
"""

def button(url_expr, label):
    return f"""<tr><td class="mim-pad" align="left" style="padding:22px 40px 30px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:{TEAL};border-radius:999px;">
<a href="{url_expr}" style="display:inline-block;padding:15px 30px;font-family:{FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">{label}</a>
</td></tr></table>
</td></tr>
"""

def items(loop, line="line", price="final_line_price", head="Your pieces"):
    return f"""<tr><td class="mim-pad" style="padding:22px 40px 4px;font-family:{FONT};">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:{TEAL_D};font-weight:bold;">{head}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
{{% for {line} in {loop} %}}
<tr>
<td width="76" style="padding:12px 0;border-bottom:1px solid {MIST};vertical-align:top;">
{{% if {line}.image %}}<img src="{{{{ {line} | img_url: 'compact_cropped' }}}}" alt="{{{{ {line}.title | escape }}}}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:12px;object-fit:cover;border:0;">{{% endif %}}
</td>
<td style="padding:12px 10px;border-bottom:1px solid {MIST};vertical-align:top;font-size:15px;line-height:1.45;color:{INK};">
<strong>{{% if {line}.product.title %}}{{{{ {line}.product.title }}}}{{% else %}}{{{{ {line}.title }}}}{{% endif %}}</strong>
{{% if {line}.variant.title != 'Default Title' and {line}.variant.title != blank %}}<br><span style="font-size:13px;color:{MUTED};">{{{{ {line}.variant.title }}}}</span>{{% endif %}}
<br><span style="font-size:13px;color:{MUTED};">Qty {{{{ {line}.quantity }}}}</span>
</td>
<td align="right" style="padding:12px 0;border-bottom:1px solid {MIST};vertical-align:top;font-size:15px;color:{INK};white-space:nowrap;">{{{{ {line}.{price} | money }}}}</td>
</tr>
{{% endfor %}}
</table>
</td></tr>
"""

def row(label, expr, strong=False):
    w = "font-weight:bold;font-size:17px;" if strong else "font-size:14px;"
    return f"""<tr><td style="padding:5px 0;font-family:{FONT};{w}color:{INK};">{label}</td><td align="right" style="padding:5px 0;font-family:{FONT};{w}color:{INK};">{expr}</td></tr>"""

def totals():
    return f"""<tr><td class="mim-pad" style="padding:12px 40px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
{row("Subtotal","{{ subtotal_price | money }}")}
{{% if total_discounts > 0 %}}{row("Discount","−{{ total_discounts | money }}")}{{% endif %}}
{{% if shipping_price > 0 %}}{row("Shipping","{{ shipping_price | money }}")}{{% endif %}}
{{% if tax_price > 0 %}}{row("Taxes","{{ tax_price | money }}")}{{% endif %}}
<tr><td colspan="2" style="border-top:1px solid {MIST};height:6px;font-size:0;">&nbsp;</td></tr>
{row("Total","{{ total_price | money_with_currency }}", True)}
</table>
</td></tr>
"""

def note(text):
    return f"""<tr><td class="mim-pad" style="padding:6px 40px 26px;font-family:{FONT};font-size:14px;line-height:1.6;color:{MUTED};">{text}</td></tr>
"""

T = {}
T["order_confirmation"] = ("Order confirmation", "Thank you for your order {{ name }}",
    intro("Order {{ name }}", "Thank you{% if customer.first_name %}, {{ customer.first_name }}{% endif %}!",
          "Your order is confirmed and we're getting your hand-printed pieces ready. We'll email you again when it's on its way.")
    + button("{{ order_status_url }}", "View your order")
    + items("subtotal_line_items") + totals()
    + note("{% if gateway contains 'Cash' or gateway contains 'COD' %}You'll pay {{ total_price | money }} in cash when your order arrives.<br>{% endif %}Need to change something? Reply to this email or message us on WhatsApp."))
T["order_edited"] = ("Order edited", "Your order {{ name }} was updated",
    intro("Order {{ name }}", "Your order has been updated", "Here are your pieces as they are now. If you didn't ask for this change, message us and we'll sort it out.")
    + button("{{ order_status_url }}", "View your order") + items("subtotal_line_items") + totals())
T["order_canceled"] = ("Order canceled", "Your order {{ name }} has been canceled",
    intro("Order {{ name }}", "Your order has been canceled",
          "{% if financial_status == 'refunded' or financial_status == 'voided' %}Any payment you made has been returned to your original payment method. Your bank may take a few days to show it.{% else %}No payment was taken for this order.{% endif %}")
    + items("subtotal_line_items", head="Canceled pieces")
    + button("{{ shop.url }}", "Continue shopping")
    + note("Questions about this cancellation? Reply to this email or message us on WhatsApp."))
T["order_refund"] = ("Refund notification", "Your refund for order {{ name }}",
    intro("Order {{ name }}", "Your refund is on its way",
          "{% if amount %}We've refunded <strong>{{ amount | money }}</strong> to your original payment method. {% else %}We've issued a refund to your original payment method. {% endif %}Your bank may take a few days to show it.")
    + button("{{ order_status_url }}", "View your order")
    + note("For cash on delivery orders we'll agree the refund method with you. Questions? Reply to this email."))
T["shipping_confirmation"] = ("Shipping confirmation", "Your MIM order {{ name }} is on its way",
    intro("Order {{ name }}", "Your pieces are on their way",
          "{% if fulfillment.item_count == item_count %}Your whole order has left our studio.{% else %}Part of your order has left our studio. We'll let you know when the rest follows.{% endif %}")
    + "{% if fulfillment.tracking_numbers.size > 0 %}" + note("Tracking number: <strong>{{ fulfillment.tracking_numbers | join: ', ' }}</strong>") + "{% endif %}"
    + button("{% if fulfillment.tracking_urls.size > 0 %}{{ fulfillment.tracking_urls.first }}{% else %}{{ order_status_url }}{% endif %}", "Track your order")
    + items("fulfillment.fulfillment_line_items", line="line", price="line_item.final_line_price").replace("line.image","line.line_item.image").replace("{{ line | img_url","{{ line.line_item | img_url").replace("line.title","line.line_item.title").replace("line.product.title","line.line_item.product.title").replace("line.variant.title","line.line_item.variant.title"))
T["shipping_update"] = ("Shipping update", "Tracking update for order {{ name }}",
    intro("Order {{ name }}", "Your tracking details have changed", "Use the button below to follow your order with the new details.")
    + "{% if fulfillment.tracking_numbers.size > 0 %}" + note("Tracking number: <strong>{{ fulfillment.tracking_numbers | join: ', ' }}</strong>") + "{% endif %}"
    + button("{% if fulfillment.tracking_urls.size > 0 %}{{ fulfillment.tracking_urls.first }}{% else %}{{ order_status_url }}{% endif %}", "Track your order"))
T["shipping_out_for_delivery"] = ("Out for delivery", "Your order {{ name }} arrives today",
    intro("Order {{ name }}", "Arriving today", "Your hand-printed pieces are almost with you.{% if gateway contains 'Cash' or gateway contains 'COD' %} Please have {{ total_price | money }} ready in cash.{% endif %}")
    + button("{{ order_status_url }}", "View your order"))
T["shipping_delivered"] = ("Delivered", "Your MIM order {{ name }} has arrived",
    intro("Order {{ name }}", "Your pieces have arrived", "We hope you love them. Each one was printed by hand, so it's yours alone. We'd love to see how you wear it: tag us on Instagram @mimcreativewear.")
    + button("{{ order_status_url }}", "View your order")
    + note("Something not right? You can exchange unworn pieces within 2 days. Reply to this email or message us on WhatsApp."))
T["abandoned_checkout"] = ("Abandoned checkout", "Your hand-printed pieces are still waiting",
    intro("Still thinking it over?", "Your pieces are saved for you",
          "Every MIM piece is printed by hand in small numbers, so we can't hold them for long. Complete your order whenever you're ready.")
    + button("{{ url }}", "Complete your order")
    + items("line_items", head="In your bag") + f"""<tr><td class="mim-pad" style="padding:12px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">{row("Subtotal","{{ subtotal_price | money }}", True)}</table></td></tr>"""
    + note("Questions about size or fabric? Message us on WhatsApp and we'll help you choose."))
T["customer_account_activate"] = ("Customer account invite", "Activate your MIM account",
    intro("Welcome to MIM", "Activate your account", "You're one click away from your MIM account: track orders, save your details and check out faster.")
    + button("{{ customer.account_activation_url }}", "Activate my account")
    + note("If you didn't expect this email, you can ignore it."))
T["customer_account_welcome"] = ("Customer account welcome", "Welcome to MIM Creative Wear",
    intro("Welcome", "Welcome to MIM{% if customer.first_name %}, {{ customer.first_name }}{% endif %}",
          "Your account is ready. Next time you shop, just sign in to check out faster and follow your orders. Every piece is printed by hand in our Cairo studio, and we're glad you're here.")
    + button("{{ shop.url }}", "Discover the collection"))
T["customer_account_reset"] = ("Customer account password reset", "Reset your MIM password",
    intro("Your account", "Reset your password", "We received a request to reset the password for your MIM account. Use the button below to choose a new one.")
    + button("{{ customer.reset_password_url }}", "Reset my password")
    + note("If you didn't ask for this, you can ignore this email. Your password stays the same."))
T["gift_card_notification"] = ("Gift card created", "Your MIM gift card",
    intro("Gift card", "A MIM gift card for you", "{% if gift_card.initial_value %}It's worth <strong>{{ gift_card.initial_value | money }}</strong> and can be used on any hand-printed piece. {% endif %}Open it to see your code, then enter it at checkout.")
    + button("{{ gift_card.url }}", "View your gift card"))

os.makedirs("templates", exist_ok=True)
for key, (title, pre, body) in T.items():
    open(f"templates/{key}.liquid", "w").write(shell(title, pre, body))
print(len(T), "templates")
