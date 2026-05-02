import { DataTypes, Model } from 'sequelize';

export default class SubscriptionPlan extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        planName: {
          type: DataTypes.STRING,
          field: 'plan_name'
        },
        price: DataTypes.INTEGER,
        durationDays: {
          type: DataTypes.INTEGER,
          field: 'duration_days'
        },
        features: {
          type: DataTypes.JSON,
          field: 'features'
        }
      },
      {
        sequelize,
        tableName: 'subscription_plans',
        timestamps: false,
        underscored: true
      }
    );
  }
}
