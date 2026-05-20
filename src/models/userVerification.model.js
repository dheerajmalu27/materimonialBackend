import { DataTypes, Model } from 'sequelize';

export default class UserVerification extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id',
        },
        mobileVerified: { type: DataTypes.BOOLEAN, field: 'mobile_verified', defaultValue: false },
        emailVerified: { type: DataTypes.BOOLEAN, field: 'email_verified', defaultValue: false },
        aadhaarVerified: { type: DataTypes.BOOLEAN, field: 'aadhaar_verified', defaultValue: false },
        photoVerified: { type: DataTypes.BOOLEAN, field: 'photo_verified', defaultValue: false },
        incomeVerified: { type: DataTypes.BOOLEAN, field: 'income_verified', defaultValue: false },
        updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
      },
      {
        sequelize,
        tableName: 'user_verifications',
        timestamps: false,
        underscored: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

