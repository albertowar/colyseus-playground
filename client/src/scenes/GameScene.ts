import { Client, Room } from "colyseus.js";

import Phaser from "phaser";

// custom scene class
export class GameScene extends Phaser.Scene {
    private client = new Client("ws://localhost:2567");
    private room: Room;

    // we will assign each player visual representation here
    // by their `sessionId`
    private playerEntities: { [sessionId: string]: Phaser.Types.Physics.Arcade.ImageWithDynamicBody } = {};

    private inputPayload = {
      left: false,
      right: false,
      up: false,
      down: false,
    };

    private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;

    private currentPlayer: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private remoteRef: Phaser.GameObjects.Rectangle;

    constructor() {
      super({ key: "part1" });
    }

    preload() {
      // preload scene
      this.load.image('ship_0001', 'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png');

      this.cursorKeys = this.input.keyboard.createCursorKeys();
    }

    async create() {
      console.log("Joining room...");

      await this.connect();
      console.log("Joined successfully!");
    }

    async connect() {
      try {
        this.room = await this.client.joinOrCreate("my_room");

        this.room.state.players.onAdd((player, sessionId) => {
          const entity = this.physics.add.image(player.x, player.y, 'ship_0001');
          this.playerEntities[sessionId] = entity;

          if (sessionId === this.room.sessionId) {
            // this is the current player!
            // (we are going to treat it differently during the update loop)
            this.currentPlayer = entity;

            // remoteRef is being used for debug only
            this.remoteRef = this.add.rectangle(0, 0, entity.width, entity.height);
            this.remoteRef.setStrokeStyle(1, 0xff0000);

            player.onChange(() => {
                this.remoteRef.x = player.x;
                this.remoteRef.y = player.y;
            });
          } else {
            player.onChange(() => {
                entity.setData('serverX', player.x);
                entity.setData('serverY', player.y);
            });
          }
        });

        this.room.state.players.onRemove((_, sessionId) => {
          const entity = this.playerEntities[sessionId];
          if (entity) {
            // destroy entity
            entity.destroy();

            // clear local reference
            delete this.playerEntities[sessionId];
          }
        });
      } catch (e) {
        console.log('Something went wrong');
        console.error(e);
      }
    }

    update(time: number, delta: number): void {
      // game loop
      if (!this.currentPlayer) { return; }

      const velocity = 2;
      this.inputPayload.left = this.cursorKeys.left.isDown;
      this.inputPayload.right = this.cursorKeys.right.isDown;
      this.inputPayload.up = this.cursorKeys.up.isDown;
      this.inputPayload.down = this.cursorKeys.down.isDown;
      this.room.send(0, this.inputPayload);

      if (this.inputPayload.left && this.currentPlayer.x > 0) {
          this.currentPlayer.x -= velocity;

      } else if (this.inputPayload.right && this.currentPlayer.x < this.room.state.mapWidth) {
          this.currentPlayer.x += velocity;
      }

      if (this.inputPayload.up && this.currentPlayer.y > 0) {
          this.currentPlayer.y -= velocity;

      } else if (this.inputPayload.down && this.currentPlayer.y < this.room.state.mapHeight) {
          this.currentPlayer.y += velocity;
      }

      for (let sessionId in this.playerEntities) {
        // do not interpolate the current player
        if (sessionId === this.room.sessionId) {
            continue;
        }

        // interpolate all other player entities
        const entity = this.playerEntities[sessionId];
        const { serverX, serverY } = entity.data.values;

        entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
        entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
      }
    }
}
