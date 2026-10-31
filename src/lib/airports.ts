export interface Airport {
  code: string
  city: string
  name: string
  state: string
}

export const INDIAN_AIRPORTS: Airport[] = [
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', state: 'Karnataka' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', state: 'Delhi' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', state: 'Maharashtra' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', state: 'Telangana' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', state: 'Tamil Nadu' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International Airport', state: 'West Bengal' },
  { code: 'GOI', city: 'Goa (Dabolim)', name: 'Dabolim Airport', state: 'Goa' },
  { code: 'GOX', city: 'Goa (Mopa)', name: 'Manohar International Airport', state: 'Goa' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport', state: 'Kerala' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International Airport', state: 'Gujarat' },
  { code: 'PNQ', city: 'Pune', name: 'Pune International Airport', state: 'Maharashtra' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', state: 'Rajasthan' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh International Airport', state: 'Uttar Pradesh' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi International Airport', state: 'Assam' },
  { code: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh International Airport', state: 'Chandigarh' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Airport', state: 'Bihar' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International Airport', state: 'Kerala' },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik International Airport', state: 'Odisha' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri International Airport', state: 'Uttar Pradesh' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam International Airport', state: 'Jammu & Kashmir' },
  { code: 'IXB', city: 'Bagdogra', name: 'Bagdogra International Airport', state: 'West Bengal' },
  { code: 'IXE', city: 'Mangalore', name: 'Mangaluru International Airport', state: 'Karnataka' },
  { code: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam Airport', state: 'Andhra Pradesh' },
  { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee International Airport', state: 'Punjab' },
  { code: 'IDR', city: 'Indore', name: 'Devi Ahilyabai Holkar Airport', state: 'Madhya Pradesh' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar International Airport', state: 'Maharashtra' },
  { code: 'BDQ', city: 'Vadodara', name: 'Vadodara Airport', state: 'Gujarat' },
  { code: 'UDR', city: 'Udaipur', name: 'Maharana Pratap Airport', state: 'Rajasthan' },
  { code: 'CJB', city: 'Coimbatore', name: 'Coimbatore International Airport', state: 'Tamil Nadu' },
  { code: 'IXR', city: 'Ranchi', name: 'Birsa Munda Airport', state: 'Jharkhand' },
  { code: 'DED', city: 'Dehradun', name: 'Jolly Grant Airport', state: 'Uttarakhand' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar International Airport', state: 'Andaman and Nicobar' },
  { code: 'IXA', city: 'Agartala', name: 'Maharaja Bir Bikram Airport', state: 'Tripura' },
  { code: 'IMF', city: 'Imphal', name: 'Bir Tikendrajit International Airport', state: 'Manipur' },
  { code: 'RPR', city: 'Raipur', name: 'Swami Vivekananda Airport', state: 'Chhattisgarh' },
  { code: 'BHO', city: 'Bhopal', name: 'Raja Bhoj Airport', state: 'Madhya Pradesh' },
  { code: 'TRZ', city: 'Tiruchirappalli', name: 'Tiruchirappalli International Airport', state: 'Tamil Nadu' },
  { code: 'IXJ', city: 'Jammu', name: 'Jammu Airport', state: 'Jammu & Kashmir' },
  { code: 'IXM', city: 'Madurai', name: 'Madurai Airport', state: 'Tamil Nadu' },
  { code: 'CNN', city: 'Kannur', name: 'Kannur International Airport', state: 'Kerala' },
]

export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase()
  if (!q) return INDIAN_AIRPORTS.slice(0, 10)
  return INDIAN_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q)
  ).slice(0, 10)
}

export function getAirportByCode(code: string): Airport | undefined {
  return INDIAN_AIRPORTS.find((a) => a.code.toUpperCase() === code.toUpperCase())
}
