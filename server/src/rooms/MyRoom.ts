import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";

const mapWidth = 800;
const mapHeight = 600;

export class MyRoom extends Room<MyRoomState> {

  onCreate (options: any) {
    this.setState(new MyRoomState());

    this.state.mapWidth = mapWidth;
    this.state.mapHeight = mapHeight;

    this.onMessage("*", (client, input) =>  {
      console.log("Received message");
    });

    // Handle player input
    this.onMessage(0, (client, input) => {
      // get reference to the player who sent the message
      const player = this.state.players.get(client.sessionId);
      const velocity = 2;

      if (input.left && player.x > 0) {
        player.x -= velocity;

      } else if (input.right && player.x < mapWidth) {
        player.x += velocity;
      }

      if (input.up && player.y > 0) {
        player.y -= velocity;

      } else if (input.down && player.y < mapHeight ) {
        player.y += velocity;
      }
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    // create Player instance
    const player = new Player();

    // place Player at a random position
    player.x = (Math.random() * mapWidth);
    player.y = (Math.random() * mapHeight);

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
