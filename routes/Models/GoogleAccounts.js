/*const GoogleAccounts = sequelize.define('GoogleAccounts', {
  id: {
    type : Sequelize.STRING,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
  bucketName: Sequelize.STRING,
  fileName: Sequelize.STRING
}, {
  tableName: 'storage',
  timestamps: false
});*/


module.exports = function(sequelize){
  return sequelize.define('GoogleAccounts', {
    id: {
      type : Sequelize.STRING,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
    bucketName: Sequelize.STRING,
    fileName: Sequelize.STRING
  }, {
    tableName: 'storage',
    timestamps: false
  });
};