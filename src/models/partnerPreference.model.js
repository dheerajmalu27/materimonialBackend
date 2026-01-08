import { DataTypes, Model } from 'sequelize';

export default class PartnerPreference extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true, // 🔥 REQUIRED
          allowNull: false,
          field: 'user_id'
        },

        minAge: {
          type: DataTypes.INTEGER,
          field: 'min_age'
        },
        maxAge: {
          type: DataTypes.INTEGER,
          field: 'max_age'
        },

        minHeightCm: {
          type: DataTypes.INTEGER,
          field: 'min_height_cm'
        },
        maxHeightCm: {
          type: DataTypes.INTEGER,
          field: 'max_height_cm'
        },

        religion: DataTypes.STRING,
        caste: DataTypes.STRING,
        education: DataTypes.STRING,

        city: DataTypes.STRING,
        state: DataTypes.STRING,
        motherTongue: {
          type: DataTypes.STRING,
          field: 'mother_tongue'
        },

        kundliMatchRequired: {
          type: DataTypes.BOOLEAN,
          field: 'kundli_match_required',
          defaultValue: false
        },

        manglikPreference: {
          type: DataTypes.STRING,
          field: 'manglik_preference',
          defaultValue: 'both'
        }
      },
      {
        sequelize,
        tableName: 'partner_preferences',
        timestamps: false // your table has no updated_at
      }
    );
  }
  static associate(models) {
  this.belongsTo(models.User, {
    foreignKey: 'userId'
  });
}
}
