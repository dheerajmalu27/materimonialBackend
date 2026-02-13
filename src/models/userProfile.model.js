import { DataTypes, Model } from 'sequelize';

export default class UserProfile extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id'
        },
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        dob: DataTypes.DATEONLY,
        birthTime: {
          type: DataTypes.TIME,
          field: 'birth_time'
        },
        heightCm: {
          type: DataTypes.INTEGER,
          field: 'height_cm'
        },
        weightKg: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'weight_kg'
        },
        maritalStatus: DataTypes.STRING,
        religion: DataTypes.STRING,
        caste: DataTypes.STRING,
        motherTongue: {
          type: DataTypes.STRING,
          field: 'mother_tongue'
        },
        aboutMe: {
          type: DataTypes.TEXT,
          field: 'about_me'
        },
        occupation: DataTypes.STRING,
        location: DataTypes.STRING,
        education: DataTypes.STRING,
        income: DataTypes.STRING,
        phone: DataTypes.STRING,
        profileImage: {
          type: DataTypes.STRING,
          field: 'profile_image'
        },
        isOnline: {
          type: DataTypes.BOOLEAN,
          field: 'is_online',
          defaultValue: false
        },
      },
      {
        sequelize,
        tableName: 'user_profiles',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}
