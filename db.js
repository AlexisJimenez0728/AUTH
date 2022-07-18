const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const config = {
  logging: false
};


if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);


const User = conn.define('user', {
  username: STRING,
  password: STRING
});
const Note = conn.define('note', {
  text: STRING
})



User.beforeCreate( async (user) => {
  user.password = await bcrypt.hash(user.password, 5)
  console.log(user.password)
})

User.byToken = async(token)=> {
  try {
    const payload = jwt.verify(token,process.env.JWT)
    const user = await User.findByPk(payload.id);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });
  if(user && bcrypt.compare(password, user.password)){
    return jwt.sign({id: user.id},process.env.JWT);
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.hasMany(Note)
Note.belongsTo(User)

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const notes = [
    {text: 'I like food'},
    {text: 'I like games'},
    {text: 'I like something'},
    ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  const [food, games, something] = await Promise.all(
    notes.map( note => Note.create(note))
  );
  food.setUser(lucy)
  games.setUser(moe)
  something.setUser(moe)
  
  
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};