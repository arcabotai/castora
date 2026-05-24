// types used in location-group routes

export interface LocationUser {
  username: string;
  name: string;
  coordinates: number[];
  profilePicture: string;
}

export interface LocationGroups {
  [key: string]: LocationUser[];
}