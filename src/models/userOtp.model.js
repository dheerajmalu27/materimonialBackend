import { DataTypes, Model } from 'sequelize';

export default class UserOtp extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'user_id'
        },

        otp: {
          type: DataTypes.STRING,
          allowNull: false
        },

        type: {
          type: DataTypes.STRING,
          allowNull: false
        },

        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at'
        },

        isUsed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: 'is_used'
        }
      },
      {
        sequelize,
        modelName: 'UserOtp',
        tableName: 'user_otps',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  }
}
