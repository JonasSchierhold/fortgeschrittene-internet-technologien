export interface PostalCodeEntry {
  postalCode: string;
  placeName: string;
  countryCode: string;
  lat: number;
  lng: number;
  adminCode2: string;
  adminCode1: string;
  adminName2: string;
  adminName1: string;
}

export interface PostalCodeResponse {
  postalCodes: PostalCodeEntry[];
}

export interface GeoNamesError {
  status: {
    message: string;
    value: number;
  };
}
