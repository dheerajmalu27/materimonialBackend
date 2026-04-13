import { DataTypes, Model } from 'sequelize';

export default class UserFamily extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id'
        },
        fatherName: {
          type: DataTypes.TEXT,
          field: 'father_name'
        },
        fatherOccupation: {
          type: DataTypes.TEXT,
          field: 'father_occupation'
        },
        fatherCompanyOrBusiness: {
          type: DataTypes.TEXT,
          field: 'father_company_or_business'
        },
        motherName: {
          type: DataTypes.TEXT,
          field: 'mother_name'
        },
        motherOccupation: {
          type: DataTypes.TEXT,
          field: 'mother_occupation'
        },
        familyType: {
          type: DataTypes.TEXT,
          field: 'family_type'
        },
        siblings: {
          type: DataTypes.TEXT,
          field: 'siblings'
        },
        familyValues: {
          type: DataTypes.TEXT,
          field: 'family_values'
        },
        familyStatus: {
          type: DataTypes.TEXT,
          field: 'family_status'
        },
        familyNativePlace: {
          type: DataTypes.TEXT,
          field: 'family_native_place'
        },
        fatherMobile: {
          type: DataTypes.STRING,
          field: 'father_mobile'
        },
        motherMobile: {
          type: DataTypes.STRING,
          field: 'mother_mobile'
        }
      },

      {
        sequelize,
        tableName: 'user_family',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}
