export interface FolioCharge {
  chargeId: number;
  department: string;
  date: Date;
  description: string;
  amount: number;
}

export interface ReservationRoom {
  id?: number;
  number: string;
  type: string;
  floor?: number;
  view?: string;
}

export interface ReservationChannel {
  id?: number;
  name: string;
  type?: string;
}

export interface ReservationDocument {
  _id: number;
  confirmationCode: string;
  guestId: number;
  guestName: string;
  guestNationality: string;
  room: ReservationRoom;
  channel: ReservationChannel;
  bookingDate: Date;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  mealPlan: string;
  purpose: string;
  ratePerNight: number;
  status: 'Confirmed' | 'In-house' | 'Checked-out' | 'Cancelled' | 'No-show';
  cancellationDate?: Date | null;
  checkOutDate?: Date | null;
  updatedAt?: Date;
  totalCharges: number;
  charges: FolioCharge[];
}
