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

          // keep a reference of it on `playerEntities`
          this.playerEntities[sessionId] = entity;

          player.onChange(() => {
            // update local position immediately
            entity.x = player.x;
            entity.y = player.y;
          });
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
      if (!this.room) { return; }

      // send input to the server
      this.inputPayload.left = this.cursorKeys.left.isDown;
      this.inputPayload.right = this.cursorKeys.right.isDown;
      this.inputPayload.up = this.cursorKeys.up.isDown;
      this.inputPayload.down = this.cursorKeys.down.isDown;
      this.room.send(0, this.inputPayload);
    }
}
