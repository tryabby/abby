-- @param {String} $1:testId
-- @param {Int} $2:type

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
	AND DATE(NOW()) - INTERVAL 1 MONTH
GROUP BY
	DATE(createdAt),
	selectedVariant