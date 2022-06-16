export class Servers {
  iceServers!: Array<Stun>;
  iceCandidatePoolSize!: number;
}

class Stun {
  urls!: Array<string>;
}