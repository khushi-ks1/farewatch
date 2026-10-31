import nodemailer from 'nodemailer'
import { SupabaseClient } from '@supabase/supabase-js'
import { FlightResult, Watch } from '@/lib/types'
import { formatINR } from '@/lib/utils'

const DAILY_GMAIL_CAP = 400

function formatISTDate(dateInput: string | Date): string {
  const d = new Date(dateInput)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function formatISTTime(dateInput: string | Date): string {
  const d = new Date(dateInput)
  const timeStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
  return `${timeStr} IST`
}

function formatDuration(mins: number): string {
  const hours = Math.floor(mins / 60)
  const remMinutes = mins % 60
  if (hours === 0) return `${remMinutes}m`
  if (remMinutes === 0) return `${hours}h`
  return `${hours}h ${remMinutes}m`
}

export function createTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass || user === 'your-email@gmail.com') {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  })
}

export interface EmailAlertFlightPayload {
  flight: FlightResult
  previousPrice?: number
}

export async function sendPriceAlertEmail(
  supabase: SupabaseClient,
  recipientEmail: string,
  watch: Watch,
  matchingFlights: EmailAlertFlightPayload[]
): Promise<{ success: boolean; skippedReason?: string }> {
  if (matchingFlights.length === 0) {
    return { success: false, skippedReason: 'No flights provided' }
  }

  // 1. Check daily Gmail email cap (400/day)
  const today = new Date().toISOString().split('T')[0]
  const { data: usageRow } = await supabase
    .from('usage')
    .select('emails_sent_count')
    .eq('usage_date', today)
    .single()

  const sentToday = usageRow?.emails_sent_count || 0
  if (sentToday >= DAILY_GMAIL_CAP) {
    console.warn(`[Mailer] Daily Gmail cap reached (${sentToday}/${DAILY_GMAIL_CAP}). Email skipped for ${recipientEmail}`)
    return { success: false, skippedReason: 'Daily send limit reached' }
  }

  const transporter = createTransport()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farewatch-gules.vercel.app'
  const pauseUrl = `${appUrl}/api/watches/${watch.id}/pause`

  const routeTitle = `${watch.origin_code} (${watch.origin_city}) → ${watch.destination_code} (${watch.destination_city})`
  const cheapestPrice = matchingFlights[0].flight.price

  // Render HTML email template
  const flightCardsHtml = matchingFlights
    .map(({ flight, previousPrice }) => {
      const stopsText = flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
      const dateText = formatISTDate(flight.flight_date)
      const depTimeText = formatISTTime(flight.departure_time)
      const arrTimeText = formatISTTime(flight.arrival_time)
      const durationText = formatDuration(flight.duration_mins)

      const discountBadge = previousPrice && previousPrice > flight.price
        ? `<div style="display:inline-block;background:#ecfdf5;color:#065f46;font-size:12px;font-weight:bold;padding:2px 8px;border-radius:12px;margin-bottom:8px;">
            Dropped from ${formatINR(previousPrice)} (${Math.round(((previousPrice - flight.price) / previousPrice) * 100)}% off)
          </div>`
        : ''

      return `
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 16px; background-color: #ffffff;">
          ${discountBadge}
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 16px; font-weight: 700; color: #111827;">${flight.airline} <span style="font-size: 13px; font-weight: 500; color: #6b7280;">(${flight.flight_number})</span></span>
            <span style="font-size: 20px; font-weight: 800; color: #0284c7;">${formatINR(flight.price)}</span>
          </div>

          <div style="font-size: 13px; color: #4b5563; margin-bottom: 12px;">
            📅 <strong>${dateText}</strong> &bull; ⏱️ <strong>${durationText}</strong> &bull; 🛫 <strong>${stopsText}</strong>
          </div>

          <div style="background-color: #f8fafc; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 14px; color: #334155;">
            🛫 <strong>${depTimeText}</strong> &rarr; 🛬 <strong>${arrTimeText}</strong>
          </div>

          <div>
            <a href="${flight.booking_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: 600; font-size: 14px; border-radius: 8px;">
              Book on Google Flights &rarr;
            </a>
          </div>
        </div>
      `
    })
    .join('')

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flight Price Alert - FareWatch</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; color: #ffffff; text-align: center;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">✈️ FareWatch</div>
          <div style="font-size: 15px; opacity: 0.9; margin-top: 4px;">Flight Price Alert for India</div>
        </div>

        <div style="padding: 24px;">
          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #0f172a;">Good news! We found deals for your watch</h2>
            <div style="font-size: 15px; font-weight: 600; color: #0284c7;">${routeTitle}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
              Target: ${watch.rule_type === 'BELOW' ? `Below ${formatINR(watch.target_price)}` : `Between ${formatINR(watch.target_price)} and ${formatINR(watch.target_price_upper || 0)}`}
              &bull; Lowest found: <strong style="color: #0f172a;">${formatINR(cheapestPrice)}</strong>
            </div>
          </div>

          ${flightCardsHtml}

          <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
            You received this email because you created a flight price alert on FareWatch.<br>
            Don't want these alerts anymore? <a href="${pauseUrl}" style="color: #64748b; text-decoration: underline;">Pause this watch</a> or manage watches in your <a href="${appUrl}/dashboard" style="color: #0284c7; text-decoration: underline;">Dashboard</a>.
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  if (!transporter) {
    console.log(`[Mailer Mock] Gmail credentials not set. Simulated sending alert email to ${recipientEmail} with ${matchingFlights.length} deals.`)
    return { success: true, skippedReason: 'Simulated send (no Gmail credentials in env)' }
  }

  try {
    await transporter.sendMail({
      from: `"FareWatch Alerts" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: `✈️ Deal found: ${watch.origin_code} → ${watch.destination_code} from ${formatINR(cheapestPrice)}`,
      html: emailHtml,
    })

    // Increment email usage
    await supabase.rpc('increment_email_usage', {
      p_date: today,
      p_count: 1,
    })

    return { success: true }
  } catch (err) {
    console.error(`[Mailer] Error sending email to ${recipientEmail}:`, err)
    return { success: false, skippedReason: String(err) }
  }
}
