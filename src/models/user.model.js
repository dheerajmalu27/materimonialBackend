import { DataTypes, Model } from 'sequelize';

export default class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        mobile: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        passwordHash: {
          type: DataTypes.TEXT,
          allowNull: false,
          field: 'password_hash'
        },
        gender: {
          type: DataTypes.ENUM('male', 'female'),
          allowNull: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active'
        },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
        }
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
   this.hasOne(models.UserProfile, {
    foreignKey: 'userId',
    as: 'profile'
  });

      this.hasMany(models.UserAddress, {
    foreignKey: 'userId',
    as: 'addresses'
  });

  this.hasMany(models.UserEducation, {
    foreignKey: 'userId',
    as: 'education'
  });
  this.hasOne(models.PartnerPreference, {
    foreignKey: 'userId',
    as: 'partnerPreference'
  });
   this.hasOne(models.UserKundli, {
    foreignKey: 'userId',
    as: 'kundli'
  });
   this.hasOne(models.UserLifestyle, {
    foreignKey: 'userId',
    as: 'lifestyle'
  });
   this.hasOne(models.UserFamily, {
    foreignKey: 'userId',
    as: 'family'
  });
   this.hasOne(models.UserProfession, {
    foreignKey: 'userId',
    as: 'profession'
  });
   this.hasMany(models.Conversation, {
    foreignKey: 'user1_id',
    as: 'conversationsAsUser1'
  });
  this.hasMany(models.Conversation, {
    foreignKey: 'user2_id',
    as: 'conversationsAsUser2'
  });
   }
}
