import { DataTypes, Model } from 'sequelize';

export default class UserLifestyle extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id'
        },
        diet: DataTypes.TEXT,
        smoking: DataTypes.TEXT,
        drinking: DataTypes.TEXT,
        hobbies: DataTypes.TEXT,
        interests: DataTypes.TEXT
      },
      {
        sequelize,
        tableName: 'user_lifestyle',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}
