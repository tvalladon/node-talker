// models/room.js
class Room {
    constructor(data) {
        this.roomId = data.roomId;
        this.zoneId = data.zoneId;
        this.name = data.name;
        this.description = data.description;
        this.lockable = data.lockable || false;
        this.locked = data.locked || false;
        this.whitelist = data.whitelist || [];
        this.temporary = data.temporary || true; // Default to true
        this.creator = data.creator || null;
        this.exits = data.exits || {};
        this.props = data.props || {};
    }
}

module.exports = Room;
