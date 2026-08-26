/* eslint-disable no-unused-vars */
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

import PropTypes from "prop-types";

const MetricCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-gray-600 border border-gray-600 rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-indigo-500 text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {value !== null ? value : <LoadingSpinner />}
          </p>
        </div>
        {Icon && (
          <div className="text-4xl text-indigo-400 opacity-80">
            <Icon />
          </div>
        )}
      </div>
    </div>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType,
};

MetricCard.defaultProps = {
  icon: null,
  value: null,
};

export default MetricCard;
