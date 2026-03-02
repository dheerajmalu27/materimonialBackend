import { DataTypes, Model } from 'sequelize';

export default class UserProfession extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          field: 'user_id'
        },
        occupationType: {
          type: DataTypes.TEXT,
          field: 'occupation_type'
        },
        designation: DataTypes.TEXT,
        companyOrBusiness: {
          type: DataTypes.TEXT,
          field: 'company_or_business'
        },
        annualIncome: {
          type: DataTypes.STRING,
          field: 'annual_income'
        },
        currency: DataTypes.TEXT,
        workingCountry: {
          type: DataTypes.TEXT,
          field: 'working_country'
        }
      },
      {
        sequelize,
        tableName: 'user_profession',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}
