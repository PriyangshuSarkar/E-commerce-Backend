export interface AddAddressRequest {
  lineOne: string;
  lineTwo?: string;
  city: string;
  country: string;
  pincode: string;
  phone: string;
  id: number; // !id reffers to the userId.
}
