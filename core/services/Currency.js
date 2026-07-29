const Users = require("./Users");

class Currency {

    get(id) {

        return Users.getData(id).money;

    }

    add(id, amount) {

        const user = Users.getData(id);

        user.money += amount;

        Users.setData(id, user);

        return user.money;

    }

    subtract(id, amount) {

        const user = Users.getData(id);

        user.money -= amount;

        Users.setData(id, user);

        return user.money;

    }

    set(id, amount) {

        const user = Users.getData(id);

        user.money = amount;

        Users.setData(id, user);

    }

}

module.exports = new Currency();