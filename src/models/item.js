/**
 * models.item.js
 */
const uuid = require("uuid");

class Item {
    constructor() {
        this.id = uuid.v4();
        this.name = 'Undefined Item';
        this.type = "bauble";
        this.description = `This small item has unlimited potential, with the right hand it can be molded into anything.`;
        this.creator = '';
        this.owner = null;
        this.location = null;
        this.isContainer = false;
    }
}

module.exports = Item;
