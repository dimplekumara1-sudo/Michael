export interface Gallery {
  id: string;
  bookingId: string;
  title: string;
  mediaURLs: string[];
  isPublic: boolean;
  megaLink: string;
  qrCodeData?: string | null;
  // Optional booking information for display
  booking?: {
    eventDate: string;
    location: string;
    eventType: string;
    status: string;
    customerName: string;
    customerEmail: string;
  };
}
