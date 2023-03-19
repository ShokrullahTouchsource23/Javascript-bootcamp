const fs = require("fs");
const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt);

class UsersRepository {
    constructor(filename){
        if(!filename){
            throw new Error('Creating a repository requires a file');
        }

        this.filename = filename;

        try{
            fs.accessSync(this.filename);
        }catch(err){
            fs.writeFileSync(this.filename, '[]');
        }
    }

    async getAll (){
        // open the file called this.filename
        return JSON.parse(await fs.promises.readFile(this.filename, {
            encoding: 'utf8'
        }));
    }

    async create(attrs){
        // attr {"email":.., "password"=""}
        attrs.id = this.randomId();

        const salt = crypto.randomBytes(4).toString('hex');
        const buf = await scrypt(attrs.password, salt, 64);

        const records = await this.getAll();
        const record = {
            ...attrs,
            password: `${buf.toString('hex')}.${salt}`
        };
        records.push(record);

       await this.writeAll(records);

       return record;
    }

    async comparePassword(password, supplied){

        const [hash, salt] = password.split('.');
        const hashSuppliedBuf = await scrypt(supplied, salt, 64);

        return hash === hashSuppliedBuf.toString('hex');
 
    }

    async writeAll(records){
        await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2));
    }

    randomId(){
        return crypto.randomBytes(4).toString('hex');
    }

    async getOne(id){
        const records =await this.getAll();
        return records.find(record => record.id === id);
    }

    async delete(id){
        const records =await this.getAll();
        const filterRecords = records.filter(record => record.id !== id);
        await this.writeAll(filterRecords);
    }

    async update(id, attr){
        const records = await this.getAll();
        const record = records.find(record => record.id === id);

        if(!record){
            throw new Error('Record with id ${id} not found');
        }

        Object.assign(record, attr);

        await this.writeAll(records);

    } 

    async getOneBy(filters){
        const records = await this.getAll();
        for(let record of records){
            let found = true;

            for(let key in filters){
                if(record[key] !== filters[key]){
                    found = false;
                }
            }
            if(found){
                return record;
            }

        }

    }




}

module.exports = new UsersRepository('users.json');

// const test = async ()=> {
//     const repo = new UsersRepository("users.json");
    // await repo.create({"email":"shokrullahjouya59@gmail.com", "password":"password"});
    // const user = await repo.getOne('fcfb675b');
    // console.log(user);
    // const users = await repo.getAll();
    // console.log(users);
    // await repo.delete('da83478c');
    // console.log(users);
    // const add = await repo.update('ab6bbfd2', {"degree": "bachelor"});
    // console.log(add);\

//     const found = await repo.getOneBy({id: "ab6bbfd2"});
//     console.log(found);

// }

// test();
