-- @param {String} $1:testId
-- @param {Int} $2:type
-- @param {DateTime} $3:date

SELECT
	COUNT(DISTINCT CASE WHEN anonymousId IS NOT NULL THEN
			anonymousId
		ELSE
			CONCAT('NULL_', UUID())
		END) AS uniqueEventCount,
	COUNT(*) AS eventCount,
	TYPE,
	createdAt,
	selectedVariant
FROM
	`Event`
WHERE
	testId = ?
	AND TYPE = ?
	AND DATE(createdAt) = DATE(?)
GROUP BY
	HOUR(createdAt),
	selectedVariant
ORDER BY createdAt ASC;