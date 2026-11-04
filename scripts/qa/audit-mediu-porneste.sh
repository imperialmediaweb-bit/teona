#!/usr/bin/env bash
# Audit „mediu”: (re)pornește site-ul din build pe portul 4441 cu mediul unui scenariu.
#   scripts/qa/audit-mediu-porneste.sh normal | rau | secret-scurt | fara-baza
set -u
SCENARIU="${1:-normal}"
JURNAL="${JURNAL:-/tmp/claude-0/-home-user-teona/c2a62746-a2a4-5b65-85f6-659c402ace1b/scratchpad/mediu/site-$SCENARIU.log}"
cd "$(dirname "$0")/../.."

# Oprește numai ce ascultă pe 4441 (alți auditori au alte porturi).
for pid in $(fuser 4441/tcp 2>/dev/null); do kill "$pid" 2>/dev/null; done
for _ in $(seq 1 20); do fuser 4441/tcp >/dev/null 2>&1 || break; sleep 0.5; done

export PORT=4441
export DATABASE_URL="postgres://postgres:x@127.0.0.1:5434/teona_audit_5"
export PAROLA_ADMIN="proba-locala-12345"
export SECRET_SESIUNE="secret-de-proba-foarte-lung-pentru-verificare"
export CLOUDINARY_CLOUD_NAME="kaz6teok"
export ADRESA_SITE="https://www.teona-ariana.ro"
export EMAIL_API="http://127.0.0.1:4442" RESEND_API_KEY="proba"
export MAILERLITE_API="http://127.0.0.1:4442" MAILERLITE_API_KEY="proba" MAILERLITE_GROUP_ID="g-pers" MAILERLITE_GROUP_FIRME="g-firme"
export ANTHROPIC_API="http://127.0.0.1:4442" ANTHROPIC_API_KEY="proba"
export STRIPE_SECRET_KEY="sk_test_de_proba" STRIPE_WEBHOOK_SECRET="whsec_audit_mediu" STRIPE_API="http://127.0.0.1:4443"
export PAYPAL_CLIENT_ID="proba" PAYPAL_CLIENT_SECRET="proba" PAYPAL_API="http://127.0.0.1:4443" PAYPAL_WEBHOOK_ID="WH-PROBA"

case "$SCENARIU" in
  rau)
    # Cum ajung variabilele când sunt lipite în Railway cu un rând nou sau un spațiu la capăt.
    export RESEND_API_KEY=$'proba\n'
    export MAILERLITE_API_KEY=$'proba\n'
    export ANTHROPIC_API_KEY=$'proba\n'
    export STRIPE_WEBHOOK_SECRET='whsec_audit_mediu '
    export PAROLA_ADMIN='proba-locala-12345 '
    export ADRESA_SITE='https://www.teona-ariana.ro/ '
    export EMAIL_API='http://127.0.0.1:4442/' MAILERLITE_API='http://127.0.0.1:4442/'
    CHEI=$(node -e 'const w=require("web-push");const k=w.generateVAPIDKeys();process.stdout.write(k.publicKey+" "+k.privateKey)')
    export VAPID_PUBLIC_KEY="${CHEI% *}"$'\n' VAPID_PRIVATE_KEY="${CHEI#* }"
    export GA_PROPERTY_ID="G-ABC123" GA_CLIENT_EMAIL="x@y.iam.gserviceaccount.com" GA_PRIVATE_KEY='"-----BEGIN PRIVATE KEY-----\nstricat\n-----END PRIVATE KEY-----\n"'
    ;;
  secret-scurt)
    export SECRET_SESIUNE="doar-20-de-semne-aici"
    ;;
  fara-baza)
    export DATABASE_URL="postgres://postgres:x@postgres.railway.internal:5432/railway"
    ;;
  anthropic-rau)
    export ANTHROPIC_API_KEY=$'proba\n'
    ;;
  stripe-rau)
    export STRIPE_SECRET_KEY=$'sk_test_de_proba\n'
    ;;
  normal) ;;
  *) echo "scenariu necunoscut: $SCENARIU"; exit 1 ;;
esac

nohup node_modules/.bin/next start > "$JURNAL" 2>&1 &
for _ in $(seq 1 60); do
  sleep 0.5
  if curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4441/robots.txt | grep -q 200; then echo "pornit ($SCENARIU) pe 4441, jurnal $JURNAL"; exit 0; fi
done
echo "n-a pornit; jurnal:"; cat "$JURNAL"; exit 1
