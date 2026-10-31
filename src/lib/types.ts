export type RuleType = 'BELOW' | 'BETWEEN'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Watch {
  id: string
  user_id: string
  origin_code: string
  origin_city: string
  destination_code: string
  destination_city: string
  departure_date_start: string
  departure_date_end: string | null
  rule_type: RuleType
  target_price: number
  target_price_upper: number | null
  is_non_stop_only: boolean
  is_active: boolean
  last_checked_at: string | null
  current_lowest_price: number | null
  created_at: string
  updated_at: string
}

export interface PriceSnapshot {
  id: string
  watch_id: string | null
  origin_code: string
  destination_code: string
  flight_date: string
  airline: string
  flight_number: string | null
  departure_time: string | null
  arrival_time: string | null
  duration_mins: number | null
  stops: number
  price: number
  booking_url: string | null
  is_mock: boolean
  captured_at: string
}

export interface AlertRecord {
  id: string
  watch_id: string
  user_id: string
  flight_number: string
  flight_date: string
  airline: string
  last_alert_price: number
  last_alerted_at: string
  created_at: string
}

export interface FlightResult {
  origin_code: string
  destination_code: string
  flight_date: string
  airline: string
  flight_number: string
  departure_time: string // ISO string or IST formatted
  arrival_time: string // ISO string or IST formatted
  duration_mins: number
  stops: number
  price: number
  booking_url: string
  is_mock?: boolean
}

export interface UsageRecord {
  id: string
  usage_date: string
  serpapi_searches_count: number
  emails_sent_count: number
  created_at: string
  updated_at: string
}
